// Demo orders for trying the admin portal before checkout exists.
//   npm run db:demo-orders            → replace demo orders (24)
//   npm run db:demo-orders -- --clear → remove all demo orders
// Demo orders are flagged isDemo and never touch stock.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type OrderStatus } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED! }) });

const customers = [
  ["Fatima Al Hashimi", "fatima.demo@example.com", "+971501112233", "dubai", "Jumeirah Village Circle", "Belgravia Heights 1", "Apt 1104"],
  ["Omar Khalid", "omar.demo@example.com", "+971552223344", "abu-dhabi", "Al Reem Island", "Sky Tower", "Apt 2302"],
  ["Priya Nair", "priya.demo@example.com", "+971563334455", "sharjah", "Al Majaz 2", "Al Majaz Residence", "Flat 705"],
  ["James Carter", "james.demo@example.com", "+971504445566", "dubai", "Dubai Marina", "Marina Gate 2", "Apt 1803"],
  ["Mariam Saeed", "mariam.demo@example.com", "+971585556677", "ajman", "Al Nuaimiya", "City Tower 3", "Flat 1201"],
  ["Rashid Al Mazrouei", "rashid.demo@example.com", "+971506667788", "ras-al-khaimah", "Al Hamra Village", "Villa 42", null],
  ["Aisha Rahman", "aisha.demo@example.com", "+971527778899", "dubai", "Business Bay", "Executive Towers B", "Apt 909"],
  ["Youssef Haddad", "youssef.demo@example.com", "+971508889900", "fujairah", "Fujairah City", "Corniche Residence", "Apt 401"],
] as const;

// Status mix weighted towards orders that need handling.
const statusPlan: OrderStatus[] = [
  "PLACED", "PLACED", "PLACED", "PLACED", "PROCESSING", "PROCESSING", "PROCESSING",
  "OUT_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED",
  "DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED", "CANCELLED", "CANCELLED", "REFUNDED",
  "PLACED", "PROCESSING", "DELIVERED", "OUT_FOR_DELIVERY",
];
const path: OrderStatus[] = ["PLACED", "PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED"];

// Deterministic pseudo-random so runs are reproducible.
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = <T,>(a: readonly T[]) => a[Math.floor(rand() * a.length)];
const round2 = (n: number) => Math.round(n * 100) / 100;

async function main() {
  const removed = await db.order.deleteMany({ where: { isDemo: true } });
  if (process.argv.includes("--clear")) {
    console.log(`Removed ${removed.count} demo orders.`);
    return;
  }

  const products = await db.product.findMany({
    where: { status: "ACTIVE" },
    include: { images: { orderBy: { position: "asc" }, take: 1 }, variants: { orderBy: { position: "asc" } } },
  });
  if (!products.length) throw new Error("No active products — run npm run db:seed first.");

  const HOUR = 3600_000;
  for (const [n, status] of statusPlan.entries()) {
    const c = customers[n % customers.length];
    const placedAt = new Date(Date.now() - (n * 13 + rand() * 6) * HOUR);
    const paymentMethod = rand() < 0.6 ? "COD" : "CARD";

    const chosen = new Set<number>();
    const lines = Array.from({ length: 1 + Math.floor(rand() * 3) }, () => {
      let p = pick(products);
      while (chosen.has(p.id)) p = pick(products);
      chosen.add(p.id);
      const variant = p.variants.length ? p.variants[0] : undefined;
      const unit = Number(variant?.price ?? p.price);
      const qty = 1 + Math.floor(rand() * 2);
      return {
        productId: p.id, slug: p.slug, sku: variant?.sku ?? p.sku, nameEn: p.nameEn, nameAr: p.nameAr,
        optionEn: variant?.labelEn ?? null, optionAr: variant?.labelAr ?? null,
        imageUrl: p.images[0]?.url ?? null, unitPrice: unit, qty, lineTotal: round2(unit * qty),
        subWeeks: p.subscribePct && rand() < 0.2 ? 4 : null,
      };
    });
    const itemsTotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
    const deliveryFee = itemsTotal >= 100 ? 0 : 15;
    const total = round2(itemsTotal + deliveryFee);

    // Timeline: walk the normal path up to the final status.
    const steps: OrderStatus[] =
      status === "CANCELLED" ? ["PLACED", "CANCELLED"]
      : status === "REFUNDED" ? [...path, "REFUNDED"]
      : path.slice(0, path.indexOf(status) + 1);
    const paid = paymentMethod === "CARD" ? status !== "PENDING_PAYMENT" : steps.includes("DELIVERED");

    const order = await db.order.create({
      data: {
        number: `TMP-${crypto.randomUUID()}`,
        isDemo: true,
        status,
        paymentMethod,
        paymentStatus: status === "REFUNDED" ? "REFUNDED" : paid ? "PAID" : "UNPAID",
        locale: n % 3 === 0 ? "ar" : "en",
        email: c[1], fullName: c[0], phone: c[2], emirate: c[3], area: c[4], building: c[5], unit: c[6],
        customerNote: n % 5 === 0 ? "Please call on arrival." : null,
        itemsTotal, discount: 0, deliveryFee, total, vatAmount: round2(total - total / 1.05),
        placedAt,
        items: { create: lines },
        events: {
          create: steps.map((s, i) => ({
            status: s,
            createdAt: new Date(placedAt.getTime() + i * 5 * HOUR),
            actorName: i === 0 ? null : "Demo staff",
            note: s === "CANCELLED" ? "Customer asked to cancel." : null,
          })),
        },
      },
    });
    await db.order.update({ where: { id: order.id }, data: { number: `IHC-${100000 + order.id}` } });
  }
  console.log(`Created ${statusPlan.length} demo orders (removed ${removed.count} old).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
