/**
 * Экспорт лендинга в один «длинный» PDF (как холст в Figma):
 * скриншоты по высоте окна → склейка (sharp) → одна страница PDF (pdf-lib).
 * Запуск: npm run export:pdf
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const outDir = path.join(root, 'export');
const outPdf = path.join(outDir, 'osipovastyle-landing.pdf');

/** Макс. сторона страницы PDF в пунктах (~200 дюймов × 72) */
const PDF_MAX_PT = 14_000;

const mime = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'application/javascript',
	'.mjs': 'application/javascript',
	'.svg': 'image/svg+xml',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.ico': 'image/x-icon',
	'.xml': 'application/xml',
	'.txt': 'text/plain; charset=utf-8',
	'.woff2': 'font/woff2',
};

if (!fs.existsSync(path.join(dist, 'index.html'))) {
	console.error('Нет dist/index.html. Сначала выполните: npm run build');
	process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const distResolved = path.resolve(dist);

function sendFile(res, filePath) {
	const ext = path.extname(filePath).toLowerCase();
	res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
	res.end(fs.readFileSync(filePath));
}

const server = http.createServer((req, res) => {
	try {
		const u = new URL(req.url || '/', 'http://127.0.0.1');
		let rel = decodeURIComponent(u.pathname).replace(/^\/+/, '');
		if (!rel || rel.endsWith('/')) {
			rel = 'index.html';
		}
		const filePath = path.resolve(path.join(dist, rel));
		if (!filePath.startsWith(distResolved + path.sep) && filePath !== distResolved) {
			res.statusCode = 403;
			res.end();
			return;
		}
		if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
			res.statusCode = 404;
			res.end('Not found');
			return;
		}
		sendFile(res, filePath);
	} catch {
		res.statusCode = 500;
		res.end();
	}
});

await new Promise((resolve, reject) => {
	server.listen(0, '127.0.0.1', (err) => {
		if (err) reject(err);
		else resolve();
	});
});

const { port } = server.address();
const base = `http://127.0.0.1:${port}`;

let browser;
try {
	console.log('Запуск браузера…');
	browser = await puppeteer.launch({
		headless: true,
		protocolTimeout: 300_000,
		args: ['--font-render-hinting=medium', '--disable-dev-shm-usage'],
	});
	const page = await browser.newPage();
	page.setDefaultTimeout(120_000);
	await page.setViewport({
		width: 1280,
		height: 900,
		deviceScaleFactor: 1,
	});

	console.log('Загрузка страницы…');
	await page.goto(`${base}/`, {
		waitUntil: 'domcontentloaded',
		timeout: 120_000,
	});

	await page.waitForSelector('main#main', { timeout: 30_000 });
	await new Promise((r) => setTimeout(r, 2000));

	await page.addStyleTag({
		content: `
			header { position: relative !important; backdrop-filter: none !important; }
			* { animation: none !important; transition: none !important; }
		`,
	});

	const scrollStep = await page.evaluate(() => window.innerHeight);
	const totalH = await page.evaluate(() =>
		Math.max(
			document.documentElement.scrollHeight,
			document.body.scrollHeight,
			document.documentElement.offsetHeight
		)
	);

	console.log(`Снимки по ${scrollStep}px, всего ~${totalH}px высоты…`);
	const tiles = [];
	for (let y = 0; y < totalH; y += scrollStep) {
		await page.evaluate((yy) => window.scrollTo(0, yy), y);
		await new Promise((r) => setTimeout(r, 400));
		const buf = await page.screenshot({ type: 'png', fullPage: false });
		tiles.push(buf);
		const done = Math.min(y + scrollStep, totalH);
		process.stdout.write(`  ${done} / ${totalH}px\r`);
	}
	console.log('');

	console.log('Склейка и PDF…');
	const metas = await Promise.all(tiles.map((b) => sharp(b).metadata()));
	const w0 = Math.max(...metas.map((m) => m.width ?? 0));
	let offsetY = 0;
	const composite = [];
	for (let i = 0; i < tiles.length; i++) {
		const h = metas[i].height ?? 0;
		composite.push({ input: tiles[i], top: offsetY, left: 0 });
		offsetY += h;
	}

	const mergedPng = await sharp({
		create: {
			width: w0,
			height: offsetY,
			channels: 4,
			background: { r: 253, g: 252, b: 250, alpha: 1 },
		},
	})
		.composite(composite)
		.png()
		.toBuffer();

	const doc = await PDFDocument.create();
	const image = await doc.embedPng(mergedPng);

	let w = image.width;
	let h = image.height;
	const m = Math.max(w, h);
	if (m > PDF_MAX_PT) {
		const s = PDF_MAX_PT / m;
		w = Math.floor(w * s);
		h = Math.floor(h * s);
	}

	const pdfPage = doc.addPage([w, h]);
	pdfPage.drawImage(image, {
		x: 0,
		y: 0,
		width: w,
		height: h,
	});

	const pdfBytes = await doc.save();
	fs.writeFileSync(outPdf, pdfBytes);

	const kb = Math.round(fs.statSync(outPdf).size / 1024);
	console.log(`Готово: ${outPdf} (${kb} KB)`);
} finally {
	if (browser) await browser.close();
	server.close();
}
