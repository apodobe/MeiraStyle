/**
 * Генерация public/og-image.jpg (1200×630) для Open Graph.
 * Запуск: node scripts/generate-og.mjs (требуется devDependency sharp).
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, '../public/og-image.jpg');

const w = 1200;
const h = 630;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f5f0e8"/>
  <rect x="72" y="72" width="5" height="486" fill="#9e6b63" rx="1"/>
  <text x="108" y="248" font-family="Georgia, 'Times New Roman', serif" font-size="76" font-weight="500" fill="#2c2825">Ирина Осипова</text>
  <text x="108" y="318" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#5c5650">Лекции и мастер-классы по стилю</text>
  <text x="108" y="372" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#8b7e74">Для брендов, шоурумов и школ</text>
</svg>`;

const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
writeFileSync(out, buf);
console.log('Written', out);
