import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { canOpen, type AdminArea } from "@/lib/admin-sections";
import { db } from "../db";
import { getSession, isStaff } from "../session";
import type { Actor } from "./audit";

/** The signed-in staff member with their section permissions (read fresh from the database). */
export const currentStaff = cache(async () => {
  const session = await getSession();
  if (!session || !isStaff(session.user.role)) return null;
  const u = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true, role: true, permissions: true, banned: true } });
  return u && !u.banned && isStaff(u.role) ? u : null;
});

/**
 * For server actions and admin API routes: returns the staff actor or throws.
 * Pass the admin area the action belongs to so permissions are enforced on the server.
 */
export async function staffActor(area?: AdminArea): Promise<Actor> {
  const staff = await currentStaff();
  if (!staff || (area && !canOpen(staff, area))) throw new Error("Forbidden");
  return { id: staff.id, name: staff.name };
}

/** For admin pages: 404 unless the signed-in staff member may open this area. */
export async function requireArea(area: AdminArea) {
  const staff = await currentStaff();
  if (!staff || !canOpen(staff, area)) notFound();
  return staff;
}
