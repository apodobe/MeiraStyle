'use strict';

/**
 * POST /api/meeting-booking.php (и /api/meeting-booking) — Telegram sendMessage.
 *
 * Прод: как capsulasna — POST /api/meeting-booking.php (PHP + curl). Этот модуль — dev и резерв для
 * POST /api/meeting-booking на Node: тот же порядок и curl, что в request.php (sendMessage, таймаут 15 с,
 * несколько chat_id — параллельно (Promise.all). По умолчанию curl; отключить: MEETING_BOOKING_USE_CURL=0.
 * Исходящий HTTPS к api.telegram.org: напрямую или через TELEGRAM_HTTPS_PROXY / HTTPS_PROXY (curl -x).
 *
 * Тексты ошибок и тело сообщения совпадают с public/api/meeting-booking.php.
 */

const https = require('https');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileP = promisify(execFile);
const { recordSuccessfulBooking } = require('./booking-attendees-store.cjs');

/** Короче 15 с: nginx→Node на Hostland ~9–10 с; иначе HTML 502 вместо JSON. */
const TELEGRAM_HTTP_TIMEOUT_MS = 6500;
const TELEGRAM_CURL_MAX_TIME_SEC = '6';
/** Весь round-trip к Telegram (все chat_id параллельно). */
const BOOKING_UPSTREAM_DEADLINE_MS = 8500;

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} timeoutMessage
 * @returns {Promise<T>}
 */
function withDeadline(promise, ms, timeoutMessage) {
	return new Promise((resolve, reject) => {
		const t = setTimeout(() => reject(new Error(timeoutMessage)), ms);
		promise.then(
			(v) => {
				clearTimeout(t);
				resolve(v);
			},
			(e) => {
				clearTimeout(t);
				reject(e instanceof Error ? e : new Error(String(e)));
			}
		);
	});
}

/**
 * URL HTTP-прокси (CONNECT). Только если задан в env — 72.56.79.23:8080/:3128 в тестах не завершали CONNECT к api.telegram.org.
 * TELEGRAM_HTTPS_PROXY= или 0 — прямой исходящий HTTPS (как без переменной).
 * @returns {string|null}
 */
function getTelegramHttpsProxyUrl() {
	const explicit = process.env.TELEGRAM_HTTPS_PROXY;
	if (explicit !== undefined && explicit !== null) {
		const t = String(explicit).trim();
		if (t === '' || t === '0' || t === 'off' || t === 'false' || t === 'direct') {
			return null;
		}
		return t;
	}
	const httpsOnly = (process.env.HTTPS_PROXY ?? '').trim();
	if (httpsOnly !== '') {
		return httpsOnly;
	}
	return null;
}

function parseJsonBody(req) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		req.on('data', (c) => chunks.push(c));
		req.on('end', () => {
			try {
				const raw = Buffer.concat(chunks).toString('utf8');
				if (!raw.trim()) return resolve({});
				resolve(JSON.parse(raw));
			} catch (e) {
				reject(e);
			}
		});
		req.on('error', reject);
	});
}

function validatePayload(body) {
	const name = typeof body.name === 'string' ? body.name.trim() : '';
	const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
	if (name.length < 1 || name.length > 200) {
		return { ok: false, error: 'Укажите имя (до 200 символов).' };
	}
	const digits = phone.replace(/\D/g, '');
	if (digits.length < 10 || digits.length > 15) {
		return { ok: false, error: 'Укажите корректный номер телефона.' };
	}
	return { ok: true, name, phone };
}

/**
 * @param {string} raw
 * @returns {string[]}
 */
function parseBookingChatIds(raw) {
	return raw
		.split(/[,;\s]+/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
}

/** Как date('d.m.Y H:i') в PHP (локальное время процесса). */
function formatDateDmYHi() {
	const d = new Date();
	const pad = (n) => String(n).padStart(2, '0');
	return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * @param {string} name
 * @param {string} phone
 * @param {string[]} chatIds
 */
function buildBookingMessage(name, phone, chatIds) {
	const idParts = chatIds.map((id) => `User ID ${id}`);
	const recipientLine = `Уведомление: ${idParts.join(', ')}`;
	return [
		'Заявка на встречу (osipovastyle.ru)',
		'',
		recipientLine,
		'',
		`Имя: ${name}`,
		`Телефон: ${phone}`,
		'',
		`Дата заявки: ${formatDateDmYHi()}`,
	].join('\n');
}

/**
 * Curl к api.telegram.org (как PHP capsulasna). С прокси на прод без node_modules — только curl.
 * @param {string} botToken
 * @param {object} bodyObj
 * @param {string|null} proxyUrl
 */
async function telegramSendMessageCapsulasnaCurl(botToken, bodyObj, proxyUrl) {
	const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
	const payload = JSON.stringify(bodyObj);
	const args = [
		'-sS',
		'--connect-timeout',
		'4',
		'--max-time',
		TELEGRAM_CURL_MAX_TIME_SEC,
	];
	if (proxyUrl) {
		args.push('-x', proxyUrl);
	}
	args.push('-X', 'POST', url, '-H', 'Content-Type: application/json', '--data-binary', payload);
	let stdout;
	try {
		const r = await execFileP('curl', args, { maxBuffer: 2 * 1024 * 1024 });
		stdout = r.stdout;
	} catch (err) {
		const e = err instanceof Error ? err : new Error(String(err));
		const anyErr = /** @type {NodeJS.ErrnoException} */ (err);
		if (anyErr && anyErr.code === 'ENOENT') {
			const ne = new Error('curl not found');
			ne.code = 'ENOENT';
			throw ne;
		}
		throw e;
	}

	try {
		return JSON.parse(stdout);
	} catch {
		throw new Error('Некорректный ответ Telegram. Попробуйте позже.');
	}
}

function telegramPostJsonHttps(pathWithQuery, bodyObj) {
	const body = JSON.stringify(bodyObj);
	return new Promise((resolve, reject) => {
		const req = https.request(
			{
				hostname: 'api.telegram.org',
				port: 443,
				path: pathWithQuery,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
					'Content-Length': Buffer.byteLength(body, 'utf8'),
				},
				timeout: TELEGRAM_HTTP_TIMEOUT_MS,
			},
			(res) => {
				let raw = '';
				res.setEncoding('utf8');
				res.on('data', (ch) => {
					raw += ch;
				});
				res.on('end', () => {
					try {
						resolve(JSON.parse(raw));
					} catch {
						reject(new Error(`Telegram: некорректный ответ (${res.statusCode})`));
					}
				});
			}
		);
		req.on('timeout', () => {
			req.destroy();
			reject(new Error('Telegram: таймаут соединения'));
		});
		req.on('error', (err) => {
			reject(err instanceof Error ? err : new Error(String(err)));
		});
		req.write(body);
		req.end();
	});
}

/**
 * @param {string} botToken
 * @param {object} bodyObj
 */
async function telegramSendUnified(botToken, bodyObj) {
	const proxyUrl = getTelegramHttpsProxyUrl();
	const useCurl = proxyUrl !== null || process.env.MEETING_BOOKING_USE_CURL !== '0';
	if (useCurl) {
		try {
			return await telegramSendMessageCapsulasnaCurl(botToken, bodyObj, proxyUrl);
		} catch (e) {
			const anyE = /** @type {NodeJS.ErrnoException} */ (e);
			if (anyE && anyE.code === 'ENOENT') {
				if (proxyUrl) {
					throw new Error(
						'Для TELEGRAM_HTTPS_PROXY на сервере нужен curl. Установите curl или снимите прокси.'
					);
				}
				return telegramPostJsonHttps(`/bot${botToken}/sendMessage`, bodyObj);
			}
			throw e;
		}
	}
	return telegramPostJsonHttps(`/bot${botToken}/sendMessage`, bodyObj);
}

/**
 * @param {string} botToken
 * @param {string} chatId
 * @param {string} text
 */
async function sendBookingTelegram(botToken, chatId, text) {
	const data = await telegramSendUnified(botToken, {
		chat_id: chatId,
		text,
		disable_web_page_preview: true,
	});

	if (!data.ok) {
		const desc = typeof data.description === 'string' ? data.description : 'sendMessage failed';
		const err = new Error(desc);
		err.code = 'TELEGRAM_API';
		throw err;
	}
}

/**
 * Тексты как в public/api/meeting-booking.php.
 * @param {unknown} err
 */
function userMessageFromBookingFailure(err) {
	const msg = err instanceof Error ? err.message : String(err);
	const botUser = (process.env.TELEGRAM_BOT_USERNAME || 'meirastylebot').replace(/^@/, '');
	const botLabel = '@' + botUser;

	if (msg.includes('chat not found') || msg.includes('chat_id is empty')) {
		return `Сначала откройте бота ${botLabel} в Telegram и нажмите «Старт» (/start), затем отправьте форму снова.`;
	}
	if (/bot was blocked/i.test(msg)) {
		return `Бот заблокирован у получателя. Разблокируйте ${botLabel} и попробуйте снова.`;
	}
	if (msg.includes('Unauthorized')) {
		return 'Ошибка конфигурации бота на сервере. Обратитесь к администратору.';
	}
	if (
		msg.includes('таймаут') ||
		msg.includes('ECONN') ||
		msg.includes('ENOTFOUND') ||
		msg.includes('ETIMEDOUT') ||
		msg.includes('EAI_AGAIN') ||
		msg.includes('socket')
	) {
		return 'Сервер не смог связаться с Telegram. Попробуйте позже.';
	}
	if (msg.includes('некорректный ответ')) {
		return 'Некорректный ответ Telegram. Попробуйте позже.';
	}
	return 'Не удалось доставить заявку в Telegram.';
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
async function handleMeetingBooking(req, res) {
	res.setHeader('Content-Type', 'application/json; charset=utf-8');

	if (req.method === 'OPTIONS') {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
		res.writeHead(204);
		res.end();
		return;
	}

	if (req.method !== 'POST') {
		res.writeHead(405);
		res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
		return;
	}

	const skip =
		process.env.PUBLIC_MEETING_BOOKING_SKIP === '1' ||
		process.env.PUBLIC_MEETING_BOOKING_SKIP === 'true';

	if (skip) {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.writeHead(200);
		res.end(JSON.stringify({ ok: true, skipped: true }));
		return;
	}

	const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
	const chatIds = parseBookingChatIds(process.env.TELEGRAM_BOOKING_CHAT_ID || '');

	if (!botToken || chatIds.length === 0) {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.writeHead(503);
		res.end(
			JSON.stringify({
				ok: false,
				error:
					'Сервер не настроен: задайте TELEGRAM_BOT_TOKEN и TELEGRAM_BOOKING_CHAT_ID в окружении.',
			})
		);
		return;
	}

	let body;
	try {
		body = await parseJsonBody(req);
	} catch {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.writeHead(400);
		res.end(JSON.stringify({ ok: false, error: 'Некорректный JSON.' }));
		return;
	}

	const v = validatePayload(body);
	if (!v.ok) {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.writeHead(400);
		res.end(JSON.stringify({ ok: false, error: v.error }));
		return;
	}

	const text = buildBookingMessage(v.name, v.phone, chatIds);
	res.setHeader('Access-Control-Allow-Origin', '*');

	try {
		await withDeadline(
			Promise.all(chatIds.map((chatId) => sendBookingTelegram(botToken, chatId, text))),
			BOOKING_UPSTREAM_DEADLINE_MS,
			'Telegram: таймаут соединения'
		);
	} catch (err) {
		const userMessage = userMessageFromBookingFailure(err);
		console.error('meeting-booking (telegram):', err instanceof Error ? err.message : err);
		res.writeHead(502);
		res.end(JSON.stringify({ ok: false, error: userMessage }));
		return;
	}

	try {
		recordSuccessfulBooking(v.name);
	} catch (e) {
		console.error('meeting-booking (attendees-store):', e instanceof Error ? e.message : e);
	}

	res.writeHead(200);
	res.end(JSON.stringify({ ok: true }));
}

module.exports = { handleMeetingBooking };
