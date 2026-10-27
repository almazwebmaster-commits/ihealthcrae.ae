"use server";

import { revalidatePath } from "next/cache";
import { staffActor } from "@/server/admin/guard";
import { resetHomeContent, saveHomeContent, type SaveHomeResult } from "@/server/home-content";

// The homepage (both languages) re-renders with the new content.
const refresh = () => revalidatePath("/", "layout");

export async function saveHomeAction(input: unknown): Promise<SaveHomeResult> {
  const result = await saveHomeContent(await staffActor("homepage"), input);
  if (result.ok) refresh();
  return result;
}

export async function resetHomeAction() {
  await resetHomeContent(await staffActor("homepage"));
  refresh();
}
