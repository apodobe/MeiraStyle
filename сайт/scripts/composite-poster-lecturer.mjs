/**
 * Афиша + колонка с портретом справа (без перекрытия текста) + мягкий шов.
 * Исходники:
 *   public/images/site/telegram-poster-text-only.png
 *   public/images/site/lecturer-portrait.png
 * Результат:
 *   public/images/site/telegram-announcement-poster-lecturer.jpg
 *
 * Запуск: node scripts/composite-poster-lecturer.mjs
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const posterPath = join(__dirname, '../public/images/site/telegram-poster-text-only.png');
const portraitPath = join(__dirname, '../public/images/site/lecturer-portrait.png');
const outPath = join(__dirname, '../public/images/site/telegram-announcement-poster-lecturer.jpg');

const CREAM = { r: 245, g: 240, b: 232 };

const meta = await sharp(posterPath).metadata();
const PW = meta.width ?? 1024;
const PH = meta.height ?? 571;

const portraitColW = 268;
const seamW = 72;

const portraitBuf = await sharp(portraitPath)
	.resize(portraitColW, PH, { fit: 'cover', position: 'centre' })
	.png()
	.toBuffer();

const seamSvg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${seamW}" height="${PH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="rgb(${CREAM.r},${CREAM.g},${CREAM.b})" stop-opacity="1"/>
      <stop offset="0.45" stop-color="rgb(${CREAM.r},${CREAM.g},${CREAM.b})" stop-opacity="0.35"/>
      <stop offset="1" stop-color="rgb(${CREAM.r},${CREAM.g},${CREAM.b})" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#s)"/>
</svg>`);

const seamBuf = await sharp(seamSvg).png().toBuffer();

const composed = await sharp(posterPath)
	.extend({
		right: portraitColW,
		background: CREAM,
	})
	.composite([
		{ input: portraitBuf, left: PW, top: 0 },
		{ input: seamBuf, left: PW - Math.floor(seamW / 2), top: 0 },
	])
	.resize(1080, null, {
		kernel: sharp.kernel.lanczos3,
		fit: 'inside',
		withoutEnlargement: false,
	})
	.jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: '4:4:4' })
	.toBuffer();

writeFileSync(outPath, composed);
console.log('Written', outPath);
