import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Prisma CLI (migrate, studio, seed bootstrap) uses Neon's DIRECT connection:
  // migrations over the PgBouncer pooler fail with "prepared statement already exists".
  // The app itself uses the pooled DATABASE_URL (src/server/db.ts).
  datasource: {
    url: env("DATABASE_URL_UNPOOLED"),
  },
});
