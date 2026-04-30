/**
 * Загрузка содержимого dist/ на FTP (пассивный режим по умолчанию в basic-ftp).
 * Учётные данные из окружения или из .env в корне проекта (не коммитится).
 */
import { Client } from 'basic-ftp';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

loadEnvFromFile(join(root, '..', '.env'));
loadEnvFromFile(join(root, '.env'));

const dist = join(root, 'dist');

const host = process.env.FTP_HOST;
const user = process.env.FTP_USER;
const password = process.env.FTP_PASSWORD;
const remoteDir = (process.env.FTP_REMOTE_DIR ?? 'htdocs').replace(/^\/+|\/+$/g, '');
const verbose = process.env.FTP_VERBOSE === '1';
const cleanRemote = process.env.FTP_CLEAN_REMOTE !== '0';

function loadEnvFromFile(path) {
	if (!existsSync(path)) return;
	const text = readFileSync(path, 'utf8');
	for (const line of text.split('\n')) {
		const t = line.trim();
		if (!t || t.startsWith('#')) continue;
		const eq = t.indexOf('=');
		if (eq === -1) continue;
		const key = t.slice(0, eq).trim();
		let val = t.slice(eq + 1).trim();
		if (
			(val.startsWith('"') && val.endsWith('"')) ||
			(val.startsWith("'") && val.endsWith("'"))
		) {
			val = val.slice(1, -1);
		}
		if (process.env[key] === undefined) {
			process.env[key] = val;
		}
	}
}

function need(name, value) {
	if (value === undefined || value === '') {
		console.error(`Задайте ${name} в .env (см. .env.example) или в окружении.`);
		process.exit(1);
	}
}

need('FTP_HOST', host);
need('FTP_USER', user);
need('FTP_PASSWORD', password);

if (!existsSync(dist)) {
	console.error('Нет папки dist/. Сначала выполните: npm run build');
	process.exit(1);
}

const client = new Client(120_000);
client.ftp.verbose = verbose;

try {
	await client.access({
		host,
		user,
		password,
		secure: false,
		port: Number(process.env.FTP_PORT ?? 21),
	});

	// Явный переход в корень: ensureDir() на части хостингов даёт 550 для уже существующего htdocs
	try {
		await client.cd('/');
	} catch {
		// часть серверов не разрешает CD /
	}
	const parts = remoteDir.split('/').filter(Boolean);
	for (const part of parts) {
		await client.cd(part);
	}

	// Сохраняем данные о зарегистрированных пользователях перед очисткой
	const dataBackupPath = join(dist, 'data', 'booking-attendees.json');
	try {
		const remoteDataPath = 'data/booking-attendees.json';
		const size = await client.size(remoteDataPath);
		if (size > 0) {
			const { mkdirSync } = await import('node:fs');
			mkdirSync(join(dist, 'data'), { recursive: true });
			await client.downloadTo(dataBackupPath, remoteDataPath);
			console.log('Бэкап data/booking-attendees.json успешно скачан.');
		}
	} catch (err) {
		// Файл не существует или другая ошибка, игнорируем
	}

	if (cleanRemote) {
		await client.clearWorkingDir();
	}
	await client.uploadFromDir(dist);

	console.log(`Готово: файлы из dist/ загружены в ${remoteDir}/`);
} catch (err) {
	console.error('Ошибка FTP:', err.message ?? err);
	process.exit(1);
} finally {
	client.close();
}
