/**
 * Готовит фото для сайта: EXIF-поворот, обрезка светлых полей (скриншоты),
 * лёгкая цветокоррекция, экспорт WebP.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'public', 'images', 'site');

/** @typedef {{ in: string; out: string; w: number; h: number; trim?: boolean; trimThreshold?: number; position?: string; resizeFit?: 'cover' | 'inside' }} Job */

/** @type {Job[]} */
const jobs = [
	{
		in: 'photos/Me/WhatsApp Image 2026-04-07 at 10.37.32 (1).jpeg',
		out: 'hero-irina',
		w: 1120,
		h: 1400,
		position: 'attention',
	},
	{
		in: 'photos/ingest/lecture-woman-weekend.png',
		out: 'lecture-woman-weekend',
		w: 1200,
		h: 900,
		position: 'attention',
	},
	/** Скриншоты / кадры с рамками: trim убирает чёрные поля stories, светлые поля selfie, размытые полосы */
	{
		in: 'photos/ingest/lecture-hall-story.png',
		out: 'lecture-auditorium',
		w: 1200,
		h: 900,
		position: 'attention',
	},
	{
		in: 'photos/ingest/lecture-dress-code.png',
		out: 'lecture-group-celebration',
		w: 1200,
		h: 900,
		position: 'attention',
	},
	{
		in: 'photos/ingest/lecture-selfie-duo.png',
		out: 'lecture-gathering',
		w: 1200,
		h: 900,
		position: 'attention',
	},
	{
		in: 'photos/Lections/WhatsApp Image 2026-04-07 at 10.37.30.jpeg',
		out: 'lecture-retail-group',
		w: 1120,
		h: 1400,
		position: 'north',
	},
	{
		in: 'photos/ingest/model-editorial-cards.png',
		out: 'model-editorial-cards',
		w: 1120,
		h: 1400,
		position: 'attention',
	},
	{
		in: 'photos/ingest/model-editorial-tonal.png',
		out: 'model-editorial-tonal',
		w: 1120,
		h: 1400,
		position: 'attention',
	},
	{
		in: 'photos/ingest/model-editorial-portrait.png',
		out: 'model-editorial-portrait',
		w: 1120,
		h: 1400,
		position: 'attention',
	},
	{
		in: 'photos/ingest/model-styling-session.png',
		out: 'model-styling-session',
		w: 1120,
		h: 1400,
		position: 'attention',
	},
	{
		in: 'photos/ingest/model-before-after.png',
		out: 'model-before-after',
		w: 1120,
		h: 1400,
		resizeFit: 'inside',
	},
	{
		in: 'photos/ingest/model-editorial-roses.png',
		out: 'model-editorial-roses',
		w: 1120,
		h: 1400,
		position: 'attention',
	},
	{
		in: 'photos/Stores Interiors/WhatsApp Image 2026-04-07 at 10.37.33.jpeg',
		out: 'showroom-evening-wear',
		w: 1120,
		h: 1400,
		position: 'attention',
	},
	{
		in: 'photos/Stores Interiors/WhatsApp Image 2026-04-07 at 10.37.32 (2).jpeg',
		out: 'showroom-boutique-floor',
		w: 1120,
		h: 1400,
		position: 'attention',
	},
	{
		in: 'photos/ingest/showroom-fitting-before.png',
		out: 'showroom-fitting-before',
		w: 1120,
		h: 1400,
		position: 'attention',
	},
	{
		in: 'photos/ingest/showroom-fitting-after.png',
		out: 'showroom-fitting-after',
		w: 1120,
		h: 1400,
		position: 'attention',
	},
	{
		in: 'photos/ingest/showroom-editorial-studio.png',
		out: 'showroom-editorial-studio',
		w: 1120,
		h: 1400,
		position: 'attention',
		trim: true,
		trimThreshold: 22,
	},
];

async function pipeline(job) {
	const src = path.join(root, job.in);
	const dest = path.join(outDir, `${job.out}.webp`);
	let img = sharp(src).rotate();

	if (job.trim) {
		try {
			const th = job.trimThreshold ?? 28;
			const trimmed = await img.clone().trim({ threshold: th }).toBuffer();
			const meta = await sharp(trimmed).metadata();
			if (meta.width && meta.height && meta.width > 200 && meta.height > 200) {
				img = sharp(trimmed);
			}
		} catch {
			img = sharp(src).rotate();
		}
	}

	const fit = job.resizeFit ?? 'cover';
	const resizeOpts =
		fit === 'inside'
			? { fit: /** @type {const} */ ('inside') }
			: { fit: /** @type {const} */ ('cover'), position: job.position ?? 'attention' };

	await img.resize(job.w, job.h, resizeOpts)
		.modulate({ saturation: 1.06 })
		.sharpen({ sigma: 0.35, m1: 0.8, m2: 2 })
		.webp({ quality: 86, effort: 5 })
		.toFile(dest);

	const st = await fs.stat(dest);
	console.log(`${job.out}.webp  ${Math.round(st.size / 1024)} KiB`);
}

await fs.mkdir(outDir, { recursive: true });
for (const job of jobs) {
	await pipeline(job);
}
console.log('Done:', outDir);
