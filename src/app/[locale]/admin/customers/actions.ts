"use server";

import { revalidatePath } from "next/cache";
import { staffActor } from "@/server/admin/guard";
import { setCustomerBlocked, type BlockResult } from "@/server/admin/customers";

export async function setCustomerBlockedAction(id: string, blocked: boolean, reason?: string): Promise<BlockResult> {
  const actor = await staffActor("customers");
  const result = await setCustomerBlocked(actor, id, blocked, reason);
  if (result.ok) revalidatePath("/[locale]/admin/customers", "layout");
  return result;
}
