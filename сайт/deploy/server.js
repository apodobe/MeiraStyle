'use strict';

/**
 * Статическая отдача dist/ под Phusion Passenger (Hostland Node.js).
 * Слушает порт из process.env.PORT.
 * POST /api/meeting-booking — резерв (dev); прод: /api/meeting-booking.php (PHP+curl, как capsulasna).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

// Исходящие HTTPS к api.telegram.org иначе могут «висеть» на IPv6 (AAAA) до таймаута прокси.
if (typeof dns.setDefaultResultOrder === 'function') {
	dns.setDefaultResultOrder('ipv4first');
}

function loadEnvFromFile() {
	try {
		const p = path.join(__dirname, '.env');
		if (!fs.existsSync(p)) return;
		const text = fs.readFileSync(p, 'utf8');
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
	} catch (e) {
		console.error('loadEnvFromFile:', e.message);
	}
}
loadEnvFromFile();

const { handleMeetingBooking } = require('./meeting-booking-handler.cjs');
const { getStatsForPublic } = require('./booking-attendees-store.cjs');

const root = __dirname;
const PORT = Number(process.env.PORT || process.env.PASSENGER_PORT || 3000);

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'application/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.xml': 'application/xml',
	'.txt': 'text/plain; charset=utf-8',
};

function isForbiddenRel(relPosix) {
	if (!relPosix || relPosix.startsWith('../')) return true;
	if (relPosix === 'server.js') return true;
	if (relPosix === 'meeting-booking-handler.cjs') return true;
	if (relPosix === 'booking-attendees-store.cjs') return true;
	if (relPosix === 'api/meeting-booking.php') return true;
	if (relPosix === 'api/meeting-booking.secrets.php') return true;
	if (relPosix === '.env' || relPosix.startsWith('.env.')) return true;
	if (relPosix === 'tmp' || relPosix.startsWith('tmp/')) return true;
	if (relPosix === 'data' || relPosix.startsWith('data/')) return true;
	return false;
}

function resolvePath(urlPath) {
	const decoded = decodeURIComponent(urlPath.split('?')[0]);
	const rel = decoded === '/' || decoded === '' ? 'index.html' : decoded.replace(/^\//, '');
	const joined = path.join(root, path.normalize(rel));
	if (!joined.startsWith(root)) return null;
	const relFromRoot = path.relative(root, joined);
	const relPosix = relFromRoot.split(path.sep).join('/');
	if (isForbiddenRel(relPosix)) return null;
	return joined;
}

const server = http.createServer((req, res) => {
	const pathname = new URL(req.url || '/', 'http://127.0.0.1').pathname;
	if (req.method === 'GET' && pathname === '/api/meeting-attendees') {
		res.setHeader('Content-Type', 'application/json; charset=utf-8');
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Cache-Control', 'no-store');
		try {
			const s = getStatsForPublic();
			res.writeHead(200);
			res.end(JSON.stringify({ ok: true, total: s.total, names: s.names }));
		} catch (e) {
			res.writeHead(500);
			res.end(JSON.stringify({ ok: false, error: 'stats_unavailable' }));
		}
		return;
	}

	if (
		req.method === 'POST' &&
		(pathname === '/api/meeting-booking.php' || pathname === '/api/meeting-booking')
	) {
		handleMeetingBooking(req, res).catch((err) => {
			console.error('handleMeetingBooking:', err);
			if (res.headersSent) return;
			res.setHeader('Content-Type', 'application/json; charset=utf-8');
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.writeHead(500);
			res.end(
				JSON.stringify({
					ok: false,
					error: 'Сервис бронирования временно недоступен. Попробуйте позже.',
				})
			);
		});
		return;
	}

	const filePath = resolvePath(req.url || '/');
	if (!filePath) {
		res.writeHead(403);
		res.end();
		return;
	}
	fs.readFile(filePath, (err, data) => {
		if (err) {
			res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
			res.end('Not found');
			return;
		}
		const ext = path.extname(filePath).toLowerCase();
		res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
		res.end(data);
	});
});

server.listen(PORT);
