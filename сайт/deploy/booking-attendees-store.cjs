'use strict';

/**
 * Счётчик и два последних имени после успешной отправки заявки в Telegram (POST через Node).
 * Файл: dist/data/booking-attendees.json рядом с server.js (не отдаётся статикой — см. server.js).
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'data', 'booking-attendees.json');

/**
 * @returns {{ total: number, lastTwo: [string|null, string|null] }}
 */
function readState() {
	try {
		if (!fs.existsSync(FILE)) {
			return { total: 0, lastTwo: [null, null] };
		}
		const raw = fs.readFileSync(FILE, 'utf8');
		const j = JSON.parse(raw);
		const lt = j.lastTwo;
		return {
			total: Math.max(0, Math.floor(Number(j.total) || 0)),
			lastTwo: [typeof lt?.[0] === 'string' ? lt[0] : null, typeof lt?.[1] === 'string' ? lt[1] : null],
		};
	} catch {
		return { total: 0, lastTwo: [null, null] };
	}
}

/**
 * @param {{ total: number, lastTwo: [string|null, string|null] }} s
 */
function writeState(s) {
	const dir = path.dirname(FILE);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	fs.writeFileSync(FILE, JSON.stringify(s), 'utf8');
}

/**
 * @param {string} name
 */
function recordSuccessfulBooking(name) {
	const n = String(name || '').trim();
	if (n.length < 1 || n.length > 200) {
		return;
	}
	const s = readState();
	s.total = (Number(s.total) || 0) + 1;
	s.lastTwo = [n, s.lastTwo[0] ?? null];
	writeState(s);
}

/**
 * Имена в порядке «раньше зарегистрировался — раньше в списке» (до двух для строки на сайте).
 * @returns {{ total: number, names: string[] }}
 */
function getStatsForPublic() {
	const s = readState();
	const newest = s.lastTwo[0];
	const older = s.lastTwo[1];
	/** @type {string[]} */
	const names = [];
	if (older && String(older).trim()) {
		names.push(String(older).trim());
	}
	if (newest && String(newest).trim()) {
		names.push(String(newest).trim());
	}
	return { total: s.total, names };
}

module.exports = { recordSuccessfulBooking, getStatsForPublic, readState };
