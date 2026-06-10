export interface LookbookItem {
	id: string;
	name: string;
	brand?: string;
	url: string;
	price?: number | null;
	priceLabel?: string;
	image?: string;
}

export interface LookbookOutfit {
	id: string;
	title: string;
	note?: string;
	/** Одно фото образа (если нет images) */
	image?: string;
	/** Карусель фото образа */
	images?: string[];
	items: LookbookItem[];
}

export interface Lookbook {
	slug: string;
	clientName: string;
	title: string;
	intro?: string;
	dateLabel?: string;
	outfits: LookbookOutfit[];
}
