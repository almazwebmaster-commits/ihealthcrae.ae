// Gives an existing account a role.  npm run user:role -- someone@example.com admin
// Roles: user (customer) · staff (can use /admin) · admin (staff + manages staff)

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const ROLES = ["user", "staff", "admin"];

async function main() {
  const [email, role] = process.argv.slice(2);
  if (!email || !ROLES.includes(role)) {
    console.error(`Usage: npm run user:role -- <email> <${ROLES.join("|")}>`);
    process.exit(1);
  }

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED! }) });
  try {
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      console.error(`No account for ${email}. Register it on the site first.`);
      process.exit(1);
    }
    // "staff" made from the command line can open every section; fine-tune on the admin Staff page.
    const permissions = role === "staff" ? ["dashboard", "orders", "customers", "products", "inventory", "promotions", "homepage"] : [];
    await db.user.update({ where: { id: user.id }, data: { role, permissions } });
    // Drop existing sessions so the new role takes effect on next sign-in.
    await db.session.deleteMany({ where: { userId: user.id } });
    console.log(`✓ ${email} is now "${role}". They need to sign in again.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
