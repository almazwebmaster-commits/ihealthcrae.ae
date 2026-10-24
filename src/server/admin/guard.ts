import "server-only";
import { getSession, isStaff } from "../session";
import type { Actor } from "./audit";

/** For server actions and admin API routes: returns the staff actor or throws. */
export async function staffActor(): Promise<Actor> {
  const session = await getSession();
  if (!session || !isStaff(session.user.role)) throw new Error("Forbidden");
  return { id: session.user.id, name: session.user.name };
}
