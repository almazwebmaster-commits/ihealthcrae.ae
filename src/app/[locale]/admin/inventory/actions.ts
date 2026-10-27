"use server";

import { revalidatePath } from "next/cache";
import { staffActor } from "@/server/admin/guard";
import { adjustStock, setLowStockAt, type AdjustResult } from "@/server/inventory";

// Stock shows on store pages (in stock / sold out), so refresh everything.
const refresh = () => revalidatePath("/", "layout");

export async function adjustStockAction(input: unknown): Promise<AdjustResult> {
  const actor = await staffActor("inventory");
  const result = await adjustStock(actor, input);
  if (result.ok) refresh();
  return result;
}

export async function setLowStockAtAction(productId: number, lowStockAt: number) {
  const actor = await staffActor("inventory");
  await setLowStockAt(actor, productId, lowStockAt);
  refresh();
}
