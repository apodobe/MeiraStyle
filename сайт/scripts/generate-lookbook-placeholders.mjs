#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const slug = process.argv[2] ?? 'katrin-sara';
const outDir = path.join(__dirname, `../public/images/lookbook/${slug}`);

const files = [
	{ name: 'look-1.svg', label: 'Образ 1', sub: 'Кэжуал', bg: '#e8dfd3', fg: '#5c5650' },
	{ name: 'look-1-alt.svg', label: 'Образ 1', sub: 'Деталь', bg: '#dfd4c8', fg: '#6b6159' },
	{ name: 'look-2.svg', label: 'Образ 2', sub: 'Вечер', bg: '#d4c9bc', fg: '#2c2825' },
	{ name: 'look-2-alt.svg', label: 'Образ 2', sub: 'Аксессуары', bg: '#e8dfd3', fg: '#5c5650' },
	{ name: 'look-3.svg', label: 'Образ 3', sub: 'Офис', bg: '#f5f0e8', fg: '#6b6159' },
	{ name: 'item-1.svg', label: 'Пиджак', sub: 'заглушка', bg: '#fdfcfa', fg: '#8b7e74', small: true },
	{ name: 'item-2.svg', label: 'Брюки', sub: 'заглушка', bg: '#f5f0e8', fg: '#8b7e74', small: true },
	{ name: 'item-3.svg', label: 'Сумка', sub: 'заглушка', bg: '#e8dfd3', fg: '#8b7e74', small: true },
	{ name: 'item-4.svg', label: 'Туфли', sub: 'заглушка', bg: '#dfd4c8', fg: '#8b7e74', small: true },
	{ name: 'item-5.svg', label: 'Платье', sub: 'заглушка', bg: '#fdfcfa', fg: '#8b7e74', small: true },
	{ name: 'item-6.svg', label: 'Пальто', sub: 'заглушка', bg: '#f5f0e8', fg: '#8b7e74', small: true },
];

function svg({ label, sub, bg, fg, small }) {
	const w = small ? 400 : 800;
	const h = small ? 400 : 1000;
	const titleSize = small ? 22 : 36;
	const subSize = small ? 14 : 20;
	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <rect x="${small ? 24 : 48}" y="${small ? 24 : 48}" width="${w - (small ? 48 : 96)}" height="${h - (small ? 48 : 96)}" fill="none" stroke="${fg}" stroke-width="2" opacity="0.25"/>
  <text x="${w / 2}" y="${h / 2 - (small ? 8 : 12)}" text-anchor="middle" font-family="Georgia, serif" font-size="${titleSize}" fill="${fg}">${label}</text>
  <text x="${w / 2}" y="${h / 2 + (small ? 20 : 32)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${subSize}" fill="${fg}" opacity="0.7">${sub}</text>
</svg>
`;
}

fs.mkdirSync(outDir, { recursive: true });
for (const f of files) {
	fs.writeFileSync(path.join(outDir, f.name), svg(f), 'utf8');
}
console.log(`placeholders: ${files.length} SVG → public/images/lookbook/${slug}/`);
