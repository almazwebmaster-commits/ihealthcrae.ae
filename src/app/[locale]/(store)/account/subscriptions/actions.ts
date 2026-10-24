"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/server/session";
import { cancelSubscription, changeInterval, setPaused, skipNextDelivery } from "@/server/subscriptions";

async function uid() {
  const s = await getSession();
  if (!s) throw new Error("Not signed in");
  return s.user.id;
}
const refresh = () => revalidatePath("/[locale]/account/subscriptions", "page");

export async function skipAction(id: number) {
  await skipNextDelivery(await uid(), id);
  refresh();
}
export async function intervalAction(id: number, weeks: number) {
  await changeInterval(await uid(), id, weeks);
  refresh();
}
export async function pauseAction(id: number, paused: boolean) {
  await setPaused(await uid(), id, paused);
  refresh();
}
export async function cancelAction(id: number) {
  await cancelSubscription(await uid(), id);
  refresh();
}
