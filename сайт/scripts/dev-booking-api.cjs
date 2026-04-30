'use strict';

/**
 * Локальный API для astro dev: прокси с :4321 на этот порт (см. astro.config.mjs).
 * Загружает переменные из .env в корне проекта.
 */
const http = require('http');
const { join } = require('path');
const { readFileSync, existsSync } = require('fs');
const { handleMeetingBooking } = require('../deploy/meeting-booking-handler.cjs');
const { getStatsForPublic } = require('../deploy/booking-attendees-store.cjs');

function loadEnvFromFile(envPath) {
	if (!existsSync(envPath)) return;
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
		if (process.env[key] === undefined) {
			process.env[key] = val;
		}
	}
}

loadEnvFromFile(join(__dirname, '..', '..', '.env'));
loadEnvFromFile(join(__dirname, '..', '.env'));

const PORT = Number(process.env.MEETING_BOOKING_API_PORT || 8787);

const server = http.createServer((req, res) => {
	const pathname = new URL(req.url || '/', 'http://127.0.0.1').pathname;
	if (req.method === 'GET' && pathname === '/api/meeting-attendees') {
		try {
			const s = getStatsForPublic();
			res.writeHead(200, {
				'Content-Type': 'application/json; charset=utf-8',
				'Cache-Control': 'no-store',
				'Access-Control-Allow-Origin': '*',
			});
			res.end(JSON.stringify({ ok: true, total: s.total, names: s.names }));
		} catch (e) {
			res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
			res.end(JSON.stringify({ ok: false, error: 'stats_unavailable' }));
		}
		return;
	}
	if (pathname === '/api/meeting-booking.php' || pathname === '/api/meeting-booking') {
		void handleMeetingBooking(req, res);
		return;
	}
	res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
	res.end('Use POST /api/meeting-booking.php or GET /api/meeting-attendees');
});

server.listen(PORT, '127.0.0.1', () => {
	console.error(
		`[dev-booking-api] POST http://127.0.0.1:${PORT}/api/meeting-booking.php · GET /api/meeting-attendees`
	);
});
