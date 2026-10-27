import { NextResponse } from "next/server";
import { staffActor } from "@/server/admin/guard";
import { exportProductsCsv } from "@/server/admin/products";

export async function GET() {
  try {
    await staffActor("products");
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const csv = await exportProductsCsv();
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ihealthcare-products-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
