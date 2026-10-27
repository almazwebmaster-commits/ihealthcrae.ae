import "server-only";
import { z } from "zod";
import { adminSections } from "@/lib/admin-sections";
import { db } from "../db";
import { audit, type Actor } from "./audit";

export const StaffInput = z.object({
  role: z.enum(["staff", "admin"]),
  permissions: z.array(z.enum(adminSections)).max(adminSections.length),
});

export type StaffResult = { ok: true } | { ok: false; error: "notFound" | "self" | "lastAdmin" | "alreadyStaff" | "invalid" };

export async function listStaff() {
  const users = await db.user.findMany({
    where: { role: { in: ["staff", "admin"] } },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, permissions: true, banned: true, createdAt: true },
  });
  const seen = await db.session.groupBy({ by: ["userId"], where: { userId: { in: users.map((u) => u.id) } }, _max: { updatedAt: true } });
  const last = new Map(seen.map((s) => [s.userId, s._max.updatedAt]));
  return users.map((u) => ({ ...u, lastActive: last.get(u.id) ?? null }));
}

const adminCount = () => db.user.count({ where: { role: "admin" } });

/** Gives a registered account staff access. */
export async function addStaff(actor: Actor, email: string, raw: unknown): Promise<StaffResult> {
  const parsed = StaffInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true, role: true, email: true } });
  if (!user) return { ok: false, error: "notFound" };
  if (user.role !== "user") return { ok: false, error: "alreadyStaff" };
  const { role, permissions } = parsed.data;
  await db.user.update({ where: { id: user.id }, data: { role, permissions: role === "admin" ? [] : permissions, banned: false, banReason: null } });
  await audit(actor, "staff.add", "user", user.id, `${user.email} as ${role}${role === "staff" ? ` (${permissions.join(", ") || "no sections"})` : ""}`);
  return { ok: true };
}

export async function updateStaff(actor: Actor, id: string, raw: unknown): Promise<StaffResult> {
  const parsed = StaffInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await db.user.findUnique({ where: { id }, select: { role: true, email: true } });
  if (!user || user.role === "user") return { ok: false, error: "notFound" };
  const { role, permissions } = parsed.data;
  // Changing your own role could lock you out; another admin has to do it.
  if (id === actor.id && role !== user.role) return { ok: false, error: "self" };
  if (user.role === "admin" && role !== "admin" && (await adminCount()) <= 1) return { ok: false, error: "lastAdmin" };
  await db.user.update({ where: { id }, data: { role, permissions: role === "admin" ? [] : permissions } });
  await audit(actor, "staff.update", "user", id, `${user.email}: ${role}${role === "staff" ? ` (${permissions.join(", ") || "no sections"})` : ""}`);
  return { ok: true };
}

/** Turns a staff member back into a regular customer account. */
export async function removeStaff(actor: Actor, id: string): Promise<StaffResult> {
  if (id === actor.id) return { ok: false, error: "self" };
  const user = await db.user.findUnique({ where: { id }, select: { role: true, email: true } });
  if (!user || user.role === "user") return { ok: false, error: "notFound" };
  if (user.role === "admin" && (await adminCount()) <= 1) return { ok: false, error: "lastAdmin" };
  await db.user.update({ where: { id }, data: { role: "user", permissions: [] } });
  await audit(actor, "staff.remove", "user", id, user.email);
  return { ok: true };
}
