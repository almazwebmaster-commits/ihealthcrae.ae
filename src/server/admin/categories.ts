import "server-only";
import { z } from "zod";
import { slugify } from "@/lib/admin/product-input";
import { googleCategoryPath } from "@/lib/google-taxonomy";
import { db } from "../db";
import { audit, type Actor } from "./audit";

const Name = z.string().trim().min(2).max(60);

export const NewCategoryInput = z.object({
  /** Existing top-level category slug, or a new top-level category */
  parent: z.union([z.object({ slug: z.string() }), z.object({ nameEn: Name, nameAr: Name })]),
  nameEn: Name,
  nameAr: Name,
  googleCategoryId: z.number().int().positive().nullable(),
});

async function uniqueSlug(base: string) {
  const root = slugify(base) || "category";
  for (let i = 0; ; i++) {
    const slug = i ? `${root}-${i + 1}` : root;
    if (!(await db.category.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Creates a subcategory (and its parent if new). If a category with the same English
 * name already exists at that level it is reused, so repeated clicks never duplicate.
 */
export async function createCategory(actor: Actor, raw: unknown) {
  const input = NewCategoryInput.parse(raw);
  const googleCategoryId = input.googleCategoryId && googleCategoryPath(input.googleCategoryId) ? input.googleCategoryId : null;

  const tops = await db.category.findMany({ where: { parentId: null }, orderBy: { position: "asc" } });
  let parent =
    "slug" in input.parent
      ? tops.find((c) => c.slug === (input.parent as { slug: string }).slug)
      : tops.find((c) => sameName(c.nameEn, (input.parent as { nameEn: string }).nameEn));
  if (!parent && "slug" in input.parent) throw new Error("Unknown parent category");
  if (!parent) {
    const p = input.parent as { nameEn: string; nameAr: string };
    parent = await db.category.create({
      data: { slug: await uniqueSlug(p.nameEn), nameEn: p.nameEn, nameAr: p.nameAr, position: (tops.at(-1)?.position ?? 0) + 1 },
    });
    await audit(actor, "category.create", "category", parent.id, p.nameEn);
  }

  const siblings = await db.category.findMany({ where: { parentId: parent.id }, orderBy: { position: "asc" } });
  let sub = siblings.find((c) => sameName(c.nameEn, input.nameEn));
  if (!sub) {
    sub = await db.category.create({
      data: {
        slug: await uniqueSlug(input.nameEn),
        nameEn: input.nameEn,
        nameAr: input.nameAr,
        parentId: parent.id,
        tint: parent.tint,
        googleCategoryId,
        position: (siblings.at(-1)?.position ?? 0) + 1,
      },
    });
    await audit(actor, "category.create", "category", sub.id, `${parent.nameEn} › ${input.nameEn}`);
  } else if (googleCategoryId && !sub.googleCategoryId) {
    await db.category.update({ where: { id: sub.id }, data: { googleCategoryId } });
  }
  return { category: parent.slug, subcategory: sub.slug };
}

/** Links an existing subcategory to a Google Merchant category (only if it has none yet). */
export async function linkGoogleCategory(actor: Actor, slug: string, googleCategoryId: number) {
  const path = googleCategoryPath(googleCategoryId);
  if (!path) throw new Error("Unknown Google category");
  const { count } = await db.category.updateMany({ where: { slug, googleCategoryId: null }, data: { googleCategoryId } });
  if (count) await audit(actor, "category.google", "category", slug, path);
}
