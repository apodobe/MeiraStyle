/**
 * Пишет public/visitka-*.svg (UTF-8) и растеризует в PNG + JPG (300 DPI, 85×55 мм).
 * Запуск: node scripts/export-visitka.mjs
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public');

const W = Math.round((85 * 300) / 25.4);
const H = Math.round((55 * 300) / 25.4);

const visitkaFrontSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="85mm" height="55mm" viewBox="0 0 340 220" fill="none">
	<title>Visitka front</title>
	<defs>
		<pattern id="stripe" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(-11)">
			<rect width="11" height="11" fill="#f5f0e8"/>
			<line x1="0" y1="10.5" x2="11" y2="10.5" stroke="#2c2825" stroke-opacity="0.035" stroke-width="1"/>
		</pattern>
	</defs>
	<rect width="340" height="220" fill="url(#stripe)"/>
	<rect x="6" y="28" width="9" height="164" rx="4.5" fill="#9e6b63" opacity="0.92"/>
	<g font-family="Cormorant Garamond, Georgia, serif">
		<g transform="translate(32, 36)">
			<rect x="0" y="0" width="44" height="44" rx="4" fill="#fdfcfa" stroke="#2c2825" stroke-opacity="0.1" stroke-width="1"/>
			<text x="22" y="30" text-anchor="middle" font-size="17" font-weight="600" fill="#2c2825" letter-spacing="0.02em">ИО</text>
		</g>
		<text x="88" y="56" font-size="22" font-weight="500" fill="#2c2825" letter-spacing="0.06em">Ирина</text>
		<text x="88" y="80" font-size="22" font-weight="500" fill="#6b6159" letter-spacing="0.06em">Осипова</text>
		<text x="88" y="100" font-size="9.5" font-weight="600" fill="#8a5d56" letter-spacing="0.08em">СТИЛИСТ · ЛЕКТОР</text>
		<text x="88" y="114" font-size="9.5" font-weight="600" fill="#8a5d56" letter-spacing="0.08em">ИМИДЖМЕЙКЕР</text>
		<line x1="88" y1="124" x2="326" y2="124" stroke="#2c2825" stroke-opacity="0.08" stroke-width="1"/>
		<text x="88" y="146" font-size="11.5" font-weight="500" fill="#5c5650" letter-spacing="0.02em">Лекции и мастер-классы по стилю</text>
		<text x="88" y="168" font-size="11.5" font-weight="500" fill="#9e6b63" letter-spacing="0.03em">osipovastyle.ru</text>
		<text x="88" y="190" font-size="11.5" font-weight="500" fill="#2c2825" letter-spacing="0.02em">+7 916 585 58 36</text>
	</g>
</svg>
`;

const visitkaBackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="85mm" height="55mm" viewBox="0 0 340 220" fill="none">
	<title>Visitka back</title>
	<defs>
		<linearGradient id="bgDark" x1="0" y1="0" x2="340" y2="220" gradientUnits="userSpaceOnUse">
			<stop offset="0%" stop-color="#2a2623"/>
			<stop offset="48%" stop-color="#1c1a18"/>
			<stop offset="100%" stop-color="#252220"/>
		</linearGradient>
		<radialGradient id="accentGlow" cx="41" cy="-18" r="200" gradientUnits="userSpaceOnUse">
			<stop offset="0%" stop-color="#9e6b63" stop-opacity="0.35"/>
			<stop offset="55%" stop-color="#9e6b63" stop-opacity="0"/>
		</radialGradient>
	</defs>
	<rect width="340" height="220" fill="url(#bgDark)"/>
	<rect width="340" height="220" fill="url(#accentGlow)"/>
	<g font-family="Cormorant Garamond, Georgia, serif">
		<text x="20" y="42" font-size="38" font-weight="400" fill="#9e6b63" fill-opacity="0.16">«</text>
		<rect x="22" y="58" width="3" height="108" rx="1.5" fill="#9e6b63" fill-opacity="0.5"/>
		<text x="36" y="82" font-size="13" font-weight="500" fill="#fdfcfa" letter-spacing="0.01em">Лекции и мастер-классы</text>
		<text x="36" y="102" font-size="13" font-weight="500" fill="#fdfcfa" letter-spacing="0.01em">для шоурумов и школ стиля</text>
		<text x="36" y="122" font-size="13" font-weight="500" fill="#e8dfd3" fill-opacity="0.92" letter-spacing="0.01em">офлайн и онлайн</text>
		<text x="36" y="158" font-size="10" font-weight="600" fill="#9e6b63" letter-spacing="0.14em">ИРИНА ОСИПОВА</text>
		<text x="36" y="178" font-size="9.5" font-weight="500" fill="#d4c9bc" letter-spacing="0.06em">Стилист · лектор · имиджмейкер</text>
		<text x="36" y="200" font-size="9" font-weight="500" fill="#fdfcfa" fill-opacity="0.75" letter-spacing="0.04em">osipovastyle.ru</text>
	</g>
</svg>
`;

const jobs = [
	{ base: 'visitka-front', svg: visitkaFrontSvg },
	{ base: 'visitka-back', svg: visitkaBackSvg },
];

for (const { base, svg } of jobs) {
	const buf = Buffer.from(svg, 'utf8');
	writeFileSync(join(publicDir, `${base}.svg`), buf);

	const pipeline = sharp(buf).resize(W, H, { fit: 'fill' });
	const pngPath = join(publicDir, `${base}.png`);
	const jpgPath = join(publicDir, `${base}.jpg`);
	writeFileSync(pngPath, await pipeline.clone().png({ compressionLevel: 9 }).toBuffer());
	writeFileSync(jpgPath, await pipeline.clone().jpeg({ quality: 92, mozjpeg: true }).toBuffer());
	console.log('Written', pngPath, jpgPath, `(${W}×${H})`);
}
