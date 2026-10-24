"use server";

import { revalidatePath } from "next/cache";
import { orderStatuses, type OrderStatus } from "@/lib/orders";
import { staffActor } from "@/server/admin/guard";
import { addOrderNote, changeOrderStatus, markOrderPaid } from "@/server/admin/orders";

const refresh = () => revalidatePath("/[locale]/admin", "layout");

export async function changeStatusAction(number: string, status: string, note: string) {
  const actor = await staffActor();
  if (!orderStatuses.includes(status as OrderStatus)) throw new Error("Invalid status");
  await changeOrderStatus(actor, number, status as OrderStatus, note);
  refresh();
}

export async function markPaidAction(number: string) {
  const actor = await staffActor();
  await markOrderPaid(actor, number);
  refresh();
}

export async function addNoteAction(number: string, note: string) {
  const actor = await staffActor();
  await addOrderNote(actor, number, note);
  refresh();
}
