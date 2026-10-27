import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { deliveryMethods } from "@/lib/store-settings";
import { quoteCart } from "@/server/checkout/quote";

const Body = z.object({
  lines: z.array(z.object({ slug: z.string().max(200), option: z.number().int().min(0).optional(), sub: z.number().int().min(1).max(52).optional(), qty: z.number().int().min(1).max(10) })).max(50),
  emirate: z.string().max(40).optional(),
  delivery: z.enum(deliveryMethods).optional(),
  payment: z.enum(["CARD", "COD"]).optional(),
  coupon: z.string().max(40).optional(),
  email: z.string().max(200).optional(),
});

/** Server-side price for the current checkout choices (what the customer will actually pay). */
export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const q = await quoteCart(parsed.data.lines, parsed.data);
  return NextResponse.json({
    lines: q.lines.map((l) => ({
      key: l.key,
      slug: l.product.slug,
      name: l.product.name,
      brandName: l.product.brandName,
      category: l.product.category,
      categoryTint: l.product.categoryTint,
      images: l.product.images.slice(0, 1),
      optionLabel: l.optionLabel ?? null,
      sub: l.sub ?? null,
      qty: l.qty,
      unit: l.unit,
      total: l.total,
      base: l.base,
    })),
    issues: q.issues,
    itemsTotal: q.itemsTotal,
    discount: q.discount,
    subtotal: q.subtotal,
    coupon: q.coupon ? { code: q.coupon.code, type: q.coupon.type, descriptionEn: q.coupon.descriptionEn, descriptionAr: q.coupon.descriptionAr } : null,
    couponDiscount: q.couponDiscount,
    couponError: q.couponError ?? null,
    deliveryFee: q.deliveryFee,
    codFee: q.codFee,
    total: q.total,
    vatAmount: q.vatAmount,
    hasSubscription: q.hasSubscription,
    express: q.express,
    codAllowed: q.codAllowed,
  });
}
