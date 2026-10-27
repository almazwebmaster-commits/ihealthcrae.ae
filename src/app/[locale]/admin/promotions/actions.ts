"use server";

import { revalidatePath } from "next/cache";
import { staffActor } from "@/server/admin/guard";
import { saveCoupon, setCouponActive, type SaveCouponResult } from "@/server/promotions";

export async function saveCouponAction(input: unknown): Promise<SaveCouponResult> {
  const actor = await staffActor();
  const result = await saveCoupon(actor, input);
  if (result.ok) revalidatePath("/[locale]/admin/promotions", "layout");
  return result;
}

export async function setCouponActiveAction(id: number, active: boolean) {
  const actor = await staffActor();
  await setCouponActive(actor, id, active);
  revalidatePath("/[locale]/admin/promotions", "layout");
}
