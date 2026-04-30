/**
 * После astro build: Passenger (Hostland) — server.js и tmp/restart.txt в dist/,
 * без размещения этих файлов в public/ (не отдаются как обычный статик до правок в Node).
 */
import { copyFileSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');
const deployServer = join(root, 'deploy', 'server.js');
const deployBookingHandler = join(root, 'deploy', 'meeting-booking-handler.cjs');
const deployAttendeesStore = join(root, 'deploy', 'booking-attendees-store.cjs');
const distServer = join(dist, 'server.js');
const distBookingHandler = join(dist, 'meeting-booking-handler.cjs');
const distAttendeesStore = join(dist, 'booking-attendees-store.cjs');
const tmpDir = join(dist, 'tmp');

if (!existsSync(dist)) {
	console.error('postbuild-hosting: нет dist/. Сначала: npm run build (astro build)');
	process.exit(1);
}
if (!existsSync(deployServer)) {
	console.error('postbuild-hosting: нет deploy/server.js');
	process.exit(1);
}
if (!existsSync(deployBookingHandler)) {
	console.error('postbuild-hosting: нет deploy/meeting-booking-handler.cjs');
	process.exit(1);
}
if (!existsSync(deployAttendeesStore)) {
	console.error('postbuild-hosting: нет deploy/booking-attendees-store.cjs');
	process.exit(1);
}

copyFileSync(deployServer, distServer);
copyFileSync(deployBookingHandler, distBookingHandler);
copyFileSync(deployAttendeesStore, distAttendeesStore);
mkdirSync(tmpDir, { recursive: true });
writeFileSync(join(tmpDir, 'restart.txt'), '');

function parseEnvFile(envPath) {
	/** @type {Record<string, string>} */
	const map = {};
	if (!existsSync(envPath)) return map;
	const text = readFileSync(envPath, 'utf8');
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
		map[key] = val;
	}
	return map;
}

function phpSingleQuoted(value) {
	return (
		"'" + String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"
	);
}

/**
 * capsulasna-стиль: dist/api/meeting-booking.secrets.php для PHP на статике (www/).
 * @param {Record<string, string>} envMap
 */
function writeMeetingBookingSecretsPhp(envMap) {
	const token = (envMap.TELEGRAM_BOT_TOKEN || '').trim();
	const idsRaw = envMap.TELEGRAM_BOOKING_CHAT_ID || '';
	const ids = idsRaw
		.split(/[,;\s]+/)
		.map((s) => s.trim())
		.filter(Boolean)
		.map((s) => parseInt(s, 10))
		.filter((n) => !Number.isNaN(n));
	const botUser = (envMap.TELEGRAM_BOT_USERNAME || 'meirastylebot')
		.trim()
		.replace(/^@/, '');
	const proxyRaw = (envMap.TELEGRAM_HTTPS_PROXY ?? envMap.HTTPS_PROXY ?? '').trim();
	const proxyLine =
		proxyRaw !== ''
			? `  'telegram_https_proxy' => ${phpSingleQuoted(proxyRaw)},\n`
			: '';

	if (!token || ids.length === 0) {
		return;
	}

	const apiDir = join(dist, 'api');
	mkdirSync(apiDir, { recursive: true });
	const body = `<?php
return [
  'bot_token' => ${phpSingleQuoted(token)},
  'chat_ids' => [${ids.join(', ')}],
  'bot_username' => ${phpSingleQuoted(botUser)},
${proxyLine}];
`;
	writeFileSync(join(apiDir, 'meeting-booking.secrets.php'), body, 'utf8');
	console.log(
		'postbuild-hosting: dist/api/meeting-booking.secrets.php (как capsulasna; не отдавать по URL)'
	);
}

const rootEnv = existsSync(join(root, '..', '.env'))
	? join(root, '..', '.env')
	: existsSync(join(root, '.env'))
		? join(root, '.env')
		: null;
if (rootEnv !== null) {
	const text = readFileSync(rootEnv, 'utf8');
	const outLines = [];
	for (const line of text.split('\n')) {
		const t = line.trim();
		if (!t || t.startsWith('#')) continue;
		const key = t.split('=')[0]?.trim();
		if (
			key &&
			(key.startsWith('TELEGRAM_') ||
				key === 'PUBLIC_MEETING_BOOKING_SKIP' ||
				key === 'HTTPS_PROXY')
		) {
			outLines.push(line.endsWith('\r') ? line.trimEnd() : line);
		}
	}
	if (outLines.length > 0) {
		writeFileSync(join(dist, '.env'), outLines.join('\n') + '\n');
		console.log(
			'postbuild-hosting: dist/.env — Telegram / бронирование (не отдавать по URL; см. server.js)'
		);
	}
	const envMap = parseEnvFile(rootEnv);
	writeMeetingBookingSecretsPhp(envMap);
}

console.log(
	'postbuild-hosting: скопированы deploy/server.js, meeting-booking-handler.cjs, booking-attendees-store.cjs → dist/, создан dist/tmp/restart.txt'
);
