"use server";

import { revalidatePath } from "next/cache";
import type { ProductStatus, SaveProductResult } from "@/lib/admin/product-input";
import { staffActor } from "@/server/admin/guard";
import { createCategory, linkGoogleCategory } from "@/server/admin/categories";
import { suggestProductCopy, type CopyResult } from "@/server/ai/product-copy";
import { importProductsCsv, saveProduct, setProductStatus, type ImportResult } from "@/server/admin/products";

// Catalogue edits affect many store pages (listings, home, product page) — refresh them all.
const refreshStore = () => revalidatePath("/", "layout");

export async function saveProductAction(input: unknown): Promise<SaveProductResult> {
  const actor = await staffActor("products");
  const result = await saveProduct(actor, input);
  if (result.ok) refreshStore();
  return result;
}

export async function setProductStatusAction(id: number, status: ProductStatus) {
  const actor = await staffActor("products");
  await setProductStatus(actor, id, status);
  refreshStore();
}

/** AI-suggested SEO titles and descriptions; nothing is saved until staff apply and save. */
export async function suggestCopyAction(input: unknown): Promise<CopyResult> {
  await staffActor("products");
  return suggestProductCopy(input);
}

/** Creates a (sub)category proposed by the AI assistant; returns the slugs to select. */
export async function createCategoryAction(input: unknown) {
  const actor = await staffActor("products");
  const result = await createCategory(actor, input);
  refreshStore();
  return result;
}

export async function linkGoogleCategoryAction(slug: string, googleCategoryId: number) {
  const actor = await staffActor("products");
  await linkGoogleCategory(actor, slug, googleCategoryId);
}

export async function importProductsAction(_prev: ImportResult | null, form: FormData): Promise<ImportResult> {
  const actor = await staffActor("products");
  const file = form.get("file");
  const apply = form.get("mode") === "apply";
  if (!(file instanceof File) || file.size === 0) return { created: 0, updated: 0, applied: false, errors: [{ row: 0, message: "No file" }] };
  if (file.size > 5 * 1024 * 1024) return { created: 0, updated: 0, applied: false, errors: [{ row: 0, message: "File too large (max 5 MB)" }] };
  const result = await importProductsCsv(actor, await file.text(), apply);
  if (apply) refreshStore();
  return result;
}
