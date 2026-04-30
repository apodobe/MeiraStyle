/**
 * Коллаж «до | после» в примерочной: обрезка рамок UI и разрез пополам для двух слайдов.
 */
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'photos/ingest/showroom-collage-source.png');
const outBefore = join(root, 'photos/ingest/showroom-fitting-before.png');
const outAfter = join(root, 'photos/ingest/showroom-fitting-after.png');

if (!existsSync(src)) {
	console.error('Нет файла:', src);
	process.exit(1);
}

const trimmed = await sharp(src).trim({ threshold: 20 }).toBuffer();
const m = await sharp(trimmed).metadata();
const w = m.width ?? 0;
const h = m.height ?? 0;
const half = Math.floor(w / 2);

await sharp(trimmed)
	.extract({ left: 0, top: 0, width: half, height: h })
	.png()
	.toFile(outBefore);
await sharp(trimmed)
	.extract({ left: half, top: 0, width: w - half, height: h })
	.png()
	.toFile(outAfter);

console.log('showroom collage', w, 'x', h, '→', half, '+', w - half);
