import "server-only";
import { db } from "../db";

export type Actor = { id: string; name: string };

/** Records a staff action. Never throws — auditing must not block the change itself. */
export async function audit(actor: Actor, action: string, entity: string, entityId: string | number, summary?: string) {
  try {
    await db.auditLog.create({
      data: { actorId: actor.id, actorName: actor.name, action, entity, entityId: String(entityId), summary },
    });
  } catch (e) {
    console.error("[audit] failed", e);
  }
}

export function recentActivity(limit = 8) {
  return db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}
