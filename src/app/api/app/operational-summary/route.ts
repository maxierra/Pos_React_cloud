import { cookies } from "next/headers";

import { getArgentinaDayRangeUtcIso, nextArgentinaDateYmd } from "@/lib/argentina-time";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET() {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;
  if (!businessId) return Response.json({ error: "missing_business" }, { status: 400 });

  const supabase = await createClient();
  const { ymd, startIso, endExclusiveIso } = getArgentinaDayRangeUtcIso();
  const expirationLimit = nextArgentinaDateYmd(ymd, 30);

  const [{ data: sales }, { data: products }] = await Promise.all([
    supabase
      .from("sales")
      .select("total,status")
      .eq("business_id", businessId)
      .gte("created_at", startIso)
      .lt("created_at", endExclusiveIso),
    supabase
      .from("products")
      .select("stock,stock_decimal,sold_by_weight,low_stock_threshold,low_stock_threshold_decimal,expires_at,active")
      .eq("business_id", businessId)
      .eq("active", true)
      .limit(5000),
  ]);

  const activeProducts = products ?? [];
  const lowStock = activeProducts.filter((product) => {
    const stock = product.sold_by_weight ? numberValue(product.stock_decimal) : numberValue(product.stock);
    const threshold = product.sold_by_weight
      ? numberValue(product.low_stock_threshold_decimal)
      : numberValue(product.low_stock_threshold);
    return stock <= threshold;
  }).length;
  const expiring = activeProducts.filter((product) => {
    const expires = typeof product.expires_at === "string" ? product.expires_at.slice(0, 10) : "";
    return expires.length === 10 && expires <= expirationLimit;
  }).length;
  const paidSales = (sales ?? []).filter((sale) => sale.status === "paid");

  return Response.json(
    {
      revenueToday: paidSales.reduce((total, sale) => total + numberValue(sale.total), 0),
      ticketsToday: paidSales.length,
      activeProducts: activeProducts.length,
      lowStock,
      expiring,
      updatedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
