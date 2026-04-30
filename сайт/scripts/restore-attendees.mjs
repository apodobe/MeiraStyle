/**
 * Восстановление dist/data/booking-attendees.json после деплоя или сбоя.
 * Формат lastTwo как в booking-attendees-store.cjs: [самая свежая заявка, предыдущая].
 * Запуск: npm run build && node scripts/restore-attendees.mjs && node scripts/deploy-ftp.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dataDir = join(root, 'dist', 'data');

const TOTAL_ATTENDEES = 4;
const LAST_TWO = ['Надежда', 'Анастасия'];

mkdirSync(dataDir, { recursive: true });
writeFileSync(
	join(dataDir, 'booking-attendees.json'),
	JSON.stringify({ total: TOTAL_ATTENDEES, lastTwo: LAST_TWO }),
	'utf8',
);

console.log(
	`restore-attendees: записан dist/data/booking-attendees.json (total=${TOTAL_ATTENDEES}, lastTwo=${JSON.stringify(LAST_TWO)})`,
);
