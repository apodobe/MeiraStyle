/**
 * Сборка вертикального объявления 1080×1350 для Telegram: фото + типографика.
 * Исходник: public/images/site/workshop-venue-announcement-source.png
 * Результат: public/images/site/telegram-announcement-workshop-2026-04-29.jpg
 *
 * Запуск: node scripts/composite-telegram-announcement.mjs
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const W = 1080;
const H = 1350;
const photoH = 780;
const panelH = H - photoH;

const photoPath = join(__dirname, '../public/images/site/workshop-venue-announcement-source.png');
const outPath = join(__dirname, '../public/images/site/telegram-announcement-workshop-2026-04-29.jpg');

const gradientSvg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${photoH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f5f0e8" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#f5f0e8" stop-opacity="0"/>
      <stop offset="0.82" stop-color="#f5f0e8" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#f5f0e8" stop-opacity="1"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#fade)"/>
</svg>`);

const panelSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${panelH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f5f0e8"/>
  <rect x="72" y="40" width="4" height="108" fill="#9e6b63" rx="1"/>
  <text x="96" y="58" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#9e6b63" letter-spacing="0.14em">ЖИВОЕ МЕРОПРИЯТИЕ · МОСКВА</text>
  <text x="96" y="128" font-family="Georgia, 'Times New Roman', serif" font-size="42" font-weight="500" fill="#2c2825">Стильный воркшоп:</text>
  <text x="96" y="182" font-family="Georgia, 'Times New Roman', serif" font-size="42" font-weight="500" fill="#2c2825">магазины + тренды</text>
  <text x="96" y="242" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#5c5650">29 апреля 2026 · среда · 19:00</text>
  <text x="96" y="284" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#2c2825">Кафе «Ришон» · ул. Образцова, 11, стр. 1А</text>
  <text x="96" y="318" font-family="Arial, Helvetica, sans-serif" font-size="17" fill="#8b7e74">Еврейский музей и центр толерантности</text>
  <text x="96" y="368" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#9e6b63" font-weight="bold">Бронь и цены — osipovastyle.ru</text>
  <text x="96" y="418" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-weight="500" fill="#2c2825">Ирина Осипова</text>
</svg>`;

const photoBuf = await sharp(photoPath)
	.resize(W, photoH, { fit: 'cover', position: 'centre' })
	.png()
	.toBuffer();

const photoWithFade = await sharp(photoBuf)
	.composite([{ input: gradientSvg, blend: 'over' }])
	.png()
	.toBuffer();

const panelBuf = await sharp(Buffer.from(panelSvg)).png().toBuffer();

const jpeg = await sharp({
	create: {
		width: W,
		height: H,
		channels: 3,
		background: { r: 245, g: 240, b: 232 },
	},
})
	.composite([
		{ input: photoWithFade, left: 0, top: 0 },
		{ input: panelBuf, left: 0, top: photoH },
	])
	.jpeg({ quality: 91, mozjpeg: true, chromaSubsampling: '4:4:4' })
	.toBuffer();

writeFileSync(outPath, jpeg);
console.log('Written', outPath);
