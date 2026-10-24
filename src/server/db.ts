import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL!;

// The local `prisma dev` database is single-process PostgreSQL that locks up
// when many idle connections pile up (dev server + Studio + seeds). Keep the
// pool small and close idle connections almost immediately when local.
const isLocalDev = /@(localhost|127\.0\.0\.1):/.test(connectionString);
const adapter = new PrismaPg(
  isLocalDev ? { connectionString, max: 4, idleTimeoutMillis: 1_000 } : { connectionString },
);

// One client per server process (dev hot-reload would otherwise open a new pool each edit).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
