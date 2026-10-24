import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { auth, STAFF_ROLES } from "./auth";

/** Current session (or null), read once per request. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** For signed-in pages: redirects to sign-in, returning here afterwards. */
export async function requireUser(locale: string, returnTo: string) {
  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=${encodeURIComponent(returnTo)}`);
  return session;
}

export function isStaff(role: string | null | undefined) {
  return STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number]);
}

/** For /admin: customers get a 404 so the admin area isn't advertised. */
export async function requireStaff(locale: string, returnTo: string) {
  const session = await requireUser(locale, returnTo);
  if (!isStaff(session.user.role)) notFound();
  return session;
}
