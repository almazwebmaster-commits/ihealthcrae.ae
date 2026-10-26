import data from "@/data/google-taxonomy.json";

/** Google Merchant Center product categories (Health & Beauty and Baby & Toddler branches). */
export const googleCategories = data.items as [id: number, path: string][];
export const googleTaxonomyVersion = data.version;

const byId = new Map(googleCategories);

export const googleCategoryPath = (id: number | null | undefined) => (id ? byId.get(id) : undefined);
