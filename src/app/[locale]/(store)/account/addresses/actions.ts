"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { emirateSlugs } from "@/lib/emirates";
import { normalizeUaePhone } from "@/lib/phone";
import { db } from "@/server/db";
import { getSession } from "@/server/session";

const MAX_ADDRESSES = 10;

const AddressInput = z.object({
  id: z.coerce.number().int().positive().optional(),
  label: z.string().trim().max(40).optional(),
  fullName: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(1).max(30),
  emirate: z.enum(emirateSlugs),
  area: z.string().trim().min(1).max(80),
  street: z.string().trim().max(120).optional(),
  building: z.string().trim().min(1).max(120),
  unit: z.string().trim().max(40).optional(),
  landmark: z.string().trim().max(120).optional(),
  isDefault: z.boolean(),
});

export type AddressFormState = { ok?: boolean; fieldErrors?: Partial<Record<string, "required" | "invalidPhone">> };

const opt = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() ? v : undefined);

async function userId() {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  return session.user.id;
}

export async function saveAddress(_prev: AddressFormState, form: FormData): Promise<AddressFormState> {
  const uid = await userId();
  const parsed = AddressInput.safeParse({
    id: opt(form.get("id")),
    label: opt(form.get("label")),
    fullName: form.get("fullName"),
    phone: form.get("phone"),
    emirate: form.get("emirate"),
    area: form.get("area"),
    street: opt(form.get("street")),
    building: form.get("building"),
    unit: opt(form.get("unit")),
    landmark: opt(form.get("landmark")),
    isDefault: form.get("isDefault") === "on",
  });

  const fieldErrors: AddressFormState["fieldErrors"] = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = "required";
    return { fieldErrors };
  }
  const phone = normalizeUaePhone(parsed.data.phone);
  if (!phone) return { fieldErrors: { phone: "invalidPhone" } };

  const { id, ...data } = parsed.data;
  const existing = await db.address.count({ where: { userId: uid } });
  // First address is always the default.
  const isDefault = data.isDefault || existing === 0;

  await db.$transaction(async (tx) => {
    if (isDefault) await tx.address.updateMany({ where: { userId: uid }, data: { isDefault: false } });
    if (id) {
      // updateMany scoped by userId: a user can only edit their own addresses.
      await tx.address.updateMany({ where: { id, userId: uid }, data: { ...data, phone, isDefault } });
    } else {
      if (existing >= MAX_ADDRESSES) return;
      await tx.address.create({ data: { ...data, phone, isDefault, userId: uid } });
    }
  });

  revalidatePath("/[locale]/account/addresses", "page");
  return { ok: true };
}

export async function deleteAddress(id: number) {
  const uid = await userId();
  await db.$transaction(async (tx) => {
    const removed = await tx.address.findFirst({ where: { id, userId: uid } });
    if (!removed) return;
    await tx.address.delete({ where: { id } });
    // Keep one default if the default was removed.
    if (removed.isDefault) {
      const next = await tx.address.findFirst({ where: { userId: uid }, orderBy: { createdAt: "asc" } });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
  revalidatePath("/[locale]/account/addresses", "page");
}

export async function setDefaultAddress(id: number) {
  const uid = await userId();
  await db.$transaction([
    db.address.updateMany({ where: { userId: uid }, data: { isDefault: false } }),
    db.address.updateMany({ where: { id, userId: uid }, data: { isDefault: true } }),
  ]);
  revalidatePath("/[locale]/account/addresses", "page");
}
