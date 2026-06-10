import type { Lookbook } from './types';

const modules = import.meta.glob<{ default: Lookbook }>('./clients/[!_]*.json', {
	eager: true,
});

export const lookbooks: Lookbook[] = Object.values(modules)
	.map((m) => m.default)
	.filter((lb) => lb.slug.length > 0 && !lb.slug.startsWith('_') && lb.outfits.length > 0)
	.sort((a, b) => a.clientName.localeCompare(b.clientName, 'ru'));

export function getLookbookBySlug(slug: string): Lookbook | undefined {
	return lookbooks.find((lb) => lb.slug === slug);
}

export function getLookbookSlugs(): string[] {
	return lookbooks.map((lb) => lb.slug);
}
