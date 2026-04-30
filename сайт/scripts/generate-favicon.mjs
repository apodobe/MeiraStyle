/**
 * Растровый favicon.ico (16/32/48) из public/favicon.svg — для краулеров и панелей
 * (часто запрашивают /favicon.ico и не принимают только SVG).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svgPath = join(root, 'public', 'favicon.svg');
const outPath = join(root, 'public', 'favicon.ico');

if (!existsSync(svgPath)) {
	console.error('generate-favicon: нет public/favicon.svg');
	process.exit(1);
}

const svg = readFileSync(svgPath);
const sizes = [48, 32, 16];
const pngBuffers = await Promise.all(
	sizes.map((size) =>
		sharp(svg, { density: 256 }).resize(size, size).png().toBuffer(),
	),
);

const ico = await pngToIco(pngBuffers);
writeFileSync(outPath, ico);
console.log('generate-favicon: записан public/favicon.ico');
