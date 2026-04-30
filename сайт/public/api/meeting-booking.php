<?php
/**
 * POST JSON → Telegram sendMessage (curl_multi, таймаут 7 с на запрос; nginx режет раньше 15 с).
 * Секреты: meeting-booking.secrets.php (генерируется при npm run build в dist/api/).
 *
 * На хостинге только с Node (Passenger) POST обрабатывает server.js; этот файл нужен для
 * деплоя «статика + PHP» в www/ (как capsulasna) и как эталон логики.
 */
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method Not Allowed']);
    exit;
}

$secretsPath = __DIR__ . '/meeting-booking.secrets.php';
if (!is_file($secretsPath)) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'Server not configured']);
    exit;
}

$cfg = require $secretsPath;
$botToken = (string)($cfg['bot_token'] ?? '');
$chatIds = $cfg['chat_ids'] ?? [];
$botUsername = ltrim((string)($cfg['bot_username'] ?? 'meirastylebot'), '@');

if ($botToken === '' || !is_array($chatIds) || count($chatIds) === 0) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'Server not configured']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
    exit;
}

$name = trim((string)($data['name'] ?? ''));
$phone = trim((string)($data['phone'] ?? ''));

if ($name === '' || $phone === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing required fields']);
    exit;
}

// Без mbstring на части хостингов mb_strlen() даёт фатал и HTML 502 вместо JSON.
$nameLen = function_exists('mb_strlen') ? mb_strlen($name, 'UTF-8') : strlen($name);
if ($nameLen > 200) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing required fields']);
    exit;
}

$digits = preg_replace('/\D/', '', $phone);
if (strlen($digits) < 10 || strlen($digits) > 15) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing required fields']);
    exit;
}

$botLabel = '@' . $botUsername;
$idParts = [];
foreach ($chatIds as $id) {
    $idParts[] = 'User ID ' . $id;
}
$recipientLine = 'Уведомление: ' . implode(', ', $idParts);

$message = "Заявка на встречу (osipovastyle.ru)\n\n"
    . $recipientLine . "\n\n"
    . "Имя: " . $name . "\n"
    . "Телефон: " . $phone . "\n\n"
    . "Дата заявки: " . date('d.m.Y H:i');

$url = 'https://api.telegram.org/bot' . $botToken . '/sendMessage';

$httpsProxy = trim((string)($cfg['telegram_https_proxy'] ?? ''));
if ($httpsProxy === '') {
    $e = getenv('TELEGRAM_HTTPS_PROXY');
    if ($e !== false && trim((string)$e) !== '') {
        $httpsProxy = trim((string)$e);
    }
}
if ($httpsProxy === '') {
    $e = getenv('HTTPS_PROXY');
    if ($e !== false && trim((string)$e) !== '') {
        $httpsProxy = trim((string)$e);
    }
}
$useProxy = $httpsProxy !== ''
    && !in_array($httpsProxy, ['0', 'off', 'direct'], true);

$mh = curl_multi_init();
$handles = [];
foreach ($chatIds as $chatId) {
    $payload = json_encode([
        'chat_id' => $chatId,
        'text' => $message,
        'disable_web_page_preview' => true,
    ], JSON_UNESCAPED_UNICODE);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 4);
    curl_setopt($ch, CURLOPT_TIMEOUT, 7);
    if ($useProxy) {
        curl_setopt($ch, CURLOPT_PROXY, $httpsProxy);
        curl_setopt($ch, CURLOPT_PROXYTYPE, CURLPROXY_HTTP);
    }
    curl_multi_add_handle($mh, $ch);
    $handles[$chatId] = $ch;
}

$running = null;
do {
    $mrc = curl_multi_exec($mh, $running);
    if ($mrc !== CURLM_OK) {
        break;
    }
    if ($running) {
        curl_multi_select($mh, 1.0);
    }
} while ($running);

foreach ($chatIds as $chatId) {
    $ch = $handles[$chatId];
    $response = curl_multi_getcontent($ch);
    $curlError = curl_error($ch);

    if ($response === false || $curlError !== '') {
        foreach ($handles as $c) {
            curl_multi_remove_handle($mh, $c);
            curl_close($c);
        }
        curl_multi_close($mh);
        http_response_code(502);
        echo json_encode([
            'ok' => false,
            'error' => 'Сервер не смог связаться с Telegram. Попробуйте позже.',
        ]);
        exit;
    }

    $decoded = json_decode($response, true);
    if (!is_array($decoded)) {
        foreach ($handles as $c) {
            curl_multi_remove_handle($mh, $c);
            curl_close($c);
        }
        curl_multi_close($mh);
        http_response_code(502);
        echo json_encode([
            'ok' => false,
            'error' => 'Некорректный ответ Telegram. Попробуйте позже.',
        ]);
        exit;
    }

    if (!empty($decoded['ok'])) {
        continue;
    }

    $description = (string)($decoded['description'] ?? '');
    $userMessage = 'Не удалось доставить заявку в Telegram.';

    if (stripos($description, 'chat not found') !== false
        || stripos($description, 'chat_id is empty') !== false) {
        $userMessage = 'Сначала откройте бота ' . $botLabel . ' в Telegram и нажмите «Старт» (/start), затем отправьте форму снова.';
    } elseif (stripos($description, 'bot was blocked') !== false) {
        $userMessage = 'Бот заблокирован у получателя. Разблокируйте ' . $botLabel . ' и попробуйте снова.';
    } elseif (stripos($description, 'Unauthorized') !== false) {
        $userMessage = 'Ошибка конфигурации бота на сервере. Обратитесь к администратору.';
    }

    foreach ($handles as $c) {
        curl_multi_remove_handle($mh, $c);
        curl_close($c);
    }
    curl_multi_close($mh);
    http_response_code(502);
    echo json_encode(['ok' => false, 'error' => $userMessage]);
    exit;
}

foreach ($handles as $c) {
    curl_multi_remove_handle($mh, $c);
    curl_close($c);
}
curl_multi_close($mh);

echo json_encode(['ok' => true]);
