/** Admin areas a staff member can be given access to. Admins can open all of them plus "staff". */
export const adminSections = ["dashboard", "orders", "customers", "products", "inventory", "promotions", "homepage"] as const;
export type AdminSection = (typeof adminSections)[number];
export type AdminArea = AdminSection | "staff";

export type StaffAccess = { role: string; permissions: string[] };

export function canOpen(user: StaffAccess | null | undefined, area: AdminArea) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role !== "staff" || area === "staff") return false;
  return user.permissions.includes(area);
}

export const isAdminSection = (s: string): s is AdminSection => (adminSections as readonly string[]).includes(s);
