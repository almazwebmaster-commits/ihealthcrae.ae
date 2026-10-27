import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL!;

// The local `prisma dev` database is single-process PostgreSQL that locks up
// when many idle connections pile up (dev server + Studio + seeds). Keep the
// pool small and close idle connections almost immediately when local.
const isLocalDev = /@(localhost|127\.0\.0\.1):/.test(connectionString);
// Neon closes connections it considers idle (and all of them when the database scales to zero),
// so recycle pooled connections regularly and keep the TCP link alive in between.
const adapter = new PrismaPg(
  isLocalDev
    ? { connectionString, max: 4, idleTimeoutMillis: 1_000 }
    : { connectionString, idleTimeoutMillis: 10_000, maxLifetimeSeconds: 60, keepAlive: true },
);

/** Read-only operations are safe to repeat; writes never are (an order or payment could be recorded twice). */
const READS = new Set(["findUnique", "findUniqueOrThrow", "findFirst", "findFirstOrThrow", "findMany", "count", "aggregate", "groupBy"]);
/** "Server closed the connection" / "can't reach the server" — the pool hands out a fresh connection next time. */
const DROPPED = new Set(["P1017", "P1001"]);

function createClient() {
  return new PrismaClient({ adapter }).$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, args, query }) {
          try {
            return await query(args);
          } catch (e) {
            const code = (e as { code?: string }).code;
            if (!READS.has(operation) || !code || !DROPPED.has(code)) throw e;
            return query(args); // one retry on a new connection
          }
        },
      },
    },
  });
}

// One client per server process (dev hot-reload would otherwise open a new pool each edit).
const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/** The client inside `db.$transaction(async (tx) => …)`; helpers that can join a transaction take this. */
export type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];
