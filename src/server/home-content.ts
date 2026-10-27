import "server-only";
import { cache } from "react";
import { HomeContentInput, normalizeHomeContent, type HomeContent } from "@/lib/home-content";
import { audit, type Actor } from "./admin/audit";
import { db } from "./db";

const KEY = "home";

/** Homepage layout and banners (defaults until staff save their own). */
export const getHomeContent = cache(async (): Promise<HomeContent & { updatedAt: Date | null; updatedBy: string | null }> => {
  const row = await db.siteContent.findUnique({ where: { key: KEY } });
  return { ...normalizeHomeContent(row?.value), updatedAt: row?.updatedAt ?? null, updatedBy: row?.updatedBy ?? null };
});

export type SaveHomeResult = { ok: true } | { ok: false; errors: string[] };

export async function saveHomeContent(actor: Actor, raw: unknown): Promise<SaveHomeResult> {
  const parsed = HomeContentInput.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: [...new Set(parsed.error.issues.map((i) => i.path.join(".")))].slice(0, 10) };
  const value = parsed.data;
  if (!value.heroSlides.some((s) => s.enabled)) return { ok: false, errors: ["heroSlides.noneEnabled"] };
  await db.siteContent.upsert({ where: { key: KEY }, create: { key: KEY, value, updatedBy: actor.name }, update: { value, updatedBy: actor.name } });
  await audit(actor, "homepage.update", "content", KEY, `${value.heroSlides.filter((s) => s.enabled).length} banners · ${value.sections.filter((s) => s.enabled).length} sections`);
  return { ok: true };
}

export async function resetHomeContent(actor: Actor) {
  await db.siteContent.deleteMany({ where: { key: KEY } });
  await audit(actor, "homepage.reset", "content", KEY);
}
