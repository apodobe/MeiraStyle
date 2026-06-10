#!/usr/bin/env node
/**
 * Обновляет price в src/data/lookbooks/clients/*.json по URL товаров.
 * Пропускает файлы с префиксом _.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientsDir = path.join(__dirname, '../src/data/lookbooks/clients');

const USER_AGENT =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function parsePriceFromHtml(html) {
	const metaPatterns = [
		/property=["']product:price:amount["'][^>]*content=["']([\d.,]+)/i,
		/content=["']([\d.,]+)["'][^>]*property=["']product:price:amount/i,
		/property=["']og:price:amount["'][^>]*content=["']([\d.,]+)/i,
		/content=["']([\d.,]+)["'][^>]*property=["']og:price:amount/i,
		/itemprop=["']price["'][^>]*content=["']([\d.,]+)/i,
		/data-price=["']([\d.,]+)/i,
		/"price"\s*:\s*"?([\d.,]+)"?/i,
		/"finalPrice"\s*:\s*"?([\d.,]+)"?/i,
		/"salePrice"\s*:\s*"?([\d.,]+)"?/i,
	];

	for (const re of metaPatterns) {
		const m = html.match(re);
		if (m) {
			const n = Number(String(m[1]).replace(/\s/g, '').replace(',', '.'));
			if (Number.isFinite(n) && n > 0) return Math.round(n);
		}
	}

	const ldBlocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
	for (const block of ldBlocks) {
		try {
			const data = JSON.parse(block[1]);
			const nodes = Array.isArray(data) ? data : [data];
			for (const node of nodes) {
				const price = extractOfferPrice(node);
				if (price) return price;
			}
		} catch {
			// ignore invalid JSON-LD
		}
	}

	return null;
}

function extractOfferPrice(node) {
	if (!node || typeof node !== 'object') return null;
	const offers = node.offers;
	const list = Array.isArray(offers) ? offers : offers ? [offers] : [];
	for (const offer of list) {
		if (!offer || typeof offer !== 'object') continue;
		const raw = offer.price ?? offer.lowPrice ?? offer.highPrice;
		const n = Number(String(raw).replace(/\s/g, '').replace(',', '.'));
		if (Number.isFinite(n) && n > 0) return Math.round(n);
	}
	if (node['@graph'] && Array.isArray(node['@graph'])) {
		for (const child of node['@graph']) {
			const p = extractOfferPrice(child);
			if (p) return p;
		}
	}
	return null;
}

async function fetchPrice(url) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 15000);
	try {
		const res = await fetch(url, {
			signal: controller.signal,
			redirect: 'follow',
			headers: {
				'User-Agent': USER_AGENT,
				Accept: 'text/html,application/xhtml+xml',
				'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
			},
		});
		if (!res.ok) return null;
		const html = await res.text();
		return parsePriceFromHtml(html);
	} catch {
		return null;
	} finally {
		clearTimeout(timer);
	}
}

function formatRub(n) {
	return new Intl.NumberFormat('ru-RU', {
		style: 'currency',
		currency: 'RUB',
		maximumFractionDigits: 0,
	}).format(n);
}

async function main() {
	if (!fs.existsSync(clientsDir)) {
		console.log('lookbook prices: нет каталога clients/');
		return;
	}

	const files = fs
		.readdirSync(clientsDir)
		.filter((f) => f.endsWith('.json') && !f.startsWith('_'));

	if (files.length === 0) {
		console.log('lookbook prices: нет клиентских JSON');
		return;
	}

	let updated = 0;
	let failed = 0;

	for (const file of files) {
		const filePath = path.join(clientsDir, file);
		const lookbook = JSON.parse(fs.readFileSync(filePath, 'utf8'));
		let fileChanged = false;

		for (const outfit of lookbook.outfits ?? []) {
			for (const item of outfit.items ?? []) {
				if (!item.url || typeof item.url !== 'string') continue;
				if (item.priceLabel && !item.url.startsWith('http')) continue;

				const price = await fetchPrice(item.url);
				if (price !== null && item.price !== price) {
					item.price = price;
					fileChanged = true;
					updated += 1;
					console.log(`  ✓ ${lookbook.slug}/${item.id}: ${formatRub(price)}`);
				} else if (price === null) {
					failed += 1;
					console.log(`  · ${lookbook.slug}/${item.id}: цену не нашли (${item.url})`);
				}
			}
		}

		if (fileChanged) {
			fs.writeFileSync(filePath, `${JSON.stringify(lookbook, null, '\t')}\n`, 'utf8');
		}
	}

	console.log(`lookbook prices: обновлено ${updated}, без цены ${failed}`);
}

main();
