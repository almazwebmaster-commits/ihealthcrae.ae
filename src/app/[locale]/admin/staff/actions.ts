"use server";

import { revalidatePath } from "next/cache";
import { staffActor } from "@/server/admin/guard";
import { addStaff, removeStaff, updateStaff, type StaffResult } from "@/server/admin/staff";

// Only admins can open the "staff" area.
const done = (r: StaffResult) => {
  if (r.ok) revalidatePath("/[locale]/admin", "layout");
  return r;
};

export async function addStaffAction(email: string, input: unknown) {
  return done(await addStaff(await staffActor("staff"), email, input));
}

export async function updateStaffAction(id: string, input: unknown) {
  return done(await updateStaff(await staffActor("staff"), id, input));
}

export async function removeStaffAction(id: string) {
  return done(await removeStaff(await staffActor("staff"), id));
}
