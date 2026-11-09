import Link from "next/link";
import { cookies } from "next/headers";
import { 
  Package,
  TrendingUp, 
  ShoppingBag, 
  Scale, 
  Receipt, 
  Wallet,
} from "lucide-react";

import { createFixedExpense, deleteFixedExpense, updateFixedExpense } from "@/app/app/(main)/reports/actions";
import {
  ProductPerformanceClient,
  type ProductPerformancePayload,
  type ProductPerformanceRow,
  type ProductWithoutSalesRow,
} from "@/app/app/(main)/reports/product-performance-client";
import { ReportsExportButton } from "@/app/app/(main)/reports/reports-export-client";
import { ExpenseModalButton } from "@/app/app/(main)/reports/scroll-to-expenses-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getArgentinaDayRangeUtcIso, nextArgentinaDateYmd } from "@/lib/argentina-time";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type SaleRow = {
  id: string;
  total: number | string;
  status: string;
  created_at: string;
  payment_method?: string | null;
};

type SaleItemRow = {
  sale_id: string;
  product_id: string | null;
  name?: string;
  quantity: number | string;
  total: number | string;
  created_at: string;
};

type ProductCostRow = {
  id: string;
  cost: number | string;
};

type ProductListRow = {
  id: string;
  name: string;
  active: boolean;
};

type FixedExpenseRow = {
  id: string;
  name: string;
  amount: number | string;
  frequency: "daily" | "weekly" | "monthly";
  category: string | null;
  active: boolean;
};

type CostLoadResult = {
  rows: ProductCostRow[];
  errorMessage: string | null;
};

type SaleItemsLoadResult = {
  rows: SaleItemRow[];
  errorMessage: string | null;
};

function toNum(v: number | string | null | undefined) {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function moneyAr(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function periodLabel(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, (m || 1) - 1, 1, 12, 0, 0, 0));
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(d);
}

function fixedExpenseForPeriod(expense: FixedExpenseRow, days: number) {
  const amount = toNum(expense.amount);
  if (expense.frequency === "daily") return amount * days;
  if (expense.frequency === "weekly") {
    return (amount / 7) * days;
  }
  return amount;
}

function translateFrequency(f: FixedExpenseRow["frequency"]) {
  if (f === "daily") return "diario";
  if (f === "weekly") return "semanal";
  return "mensual";
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function loadProductCostsChunked(
  supabase: Awaited<ReturnType<typeof createClient>>,
  uniqueProductIds: string[]
): Promise<CostLoadResult> {
  if (uniqueProductIds.length === 0) {
    return { rows: [], errorMessage: null };
  }

  const rows: ProductCostRow[] = [];
  const chunks = chunkArray(uniqueProductIds, 100);

  for (const ids of chunks) {
    const { data, error } = await supabase.from("products").select("id,cost").in("id", ids);
    if (error) {
      return {
        rows: [],
        errorMessage: `No se pudo calcular el costo de mercadería completo (${error.message}).`,
      };
    }
    rows.push(...((data ?? []) as ProductCostRow[]));
  }

  return { rows, errorMessage: null };
}

async function loadSaleItemsChunked(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  saleIds: string[],
  selectClause: string
): Promise<SaleItemsLoadResult> {
  if (saleIds.length === 0) {
    return { rows: [], errorMessage: null };
  }

  const rows: SaleItemRow[] = [];
  const chunks = chunkArray(saleIds, 100);

  for (const ids of chunks) {
    const { data, error } = await supabase
      .from("sale_items")
      .select(selectClause)
      .eq("business_id", businessId)
      .in("sale_id", ids);

    if (error) {
      return {
        rows: [],
        errorMessage: `No se pudieron cargar los productos vendidos del período (${error.message}).`,
      };
    }

    rows.push(...((data ?? []) as unknown as SaleItemRow[]));
  }

  return { rows, errorMessage: null };
}

async function loadSalesChunked(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  startIso: string,
  endIso: string,
  selectClause: string,
  status?: string
) {
  const rows: SaleRow[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    let query = supabase
      .from("sales")
      .select(selectClause)
      .eq("business_id", businessId)
      .gte("created_at", startIso)
      .lt("created_at", endIso)
      .order("created_at", { ascending: true })
      .range(from, from + pageSize - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      return {
        rows: [] as SaleRow[],
        errorMessage: `No se pudieron cargar todas las ventas del período (${error.message}).`,
      };
    }

    const chunk = ((data ?? []) as unknown) as SaleRow[];
    rows.push(...chunk);

    if (chunk.length < pageSize) {
      break;
    }
  }

  return { rows, errorMessage: null };
}

function getMonthStartYmd(ymd: string) {
  return `${ymd.slice(0, 7)}-01`;
}

function getNextMonthStartYmd(ymd: string) {
  const [year, month] = ymd.slice(0, 7).split("-").map(Number);
  if (!year || !month) return ymd;
  if (month === 12) return `${String(year + 1).padStart(4, "0")}-01-01`;
  return `${String(year).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}-01`;
}

function getWeekStartYmd(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1, 12, 0, 0, 0));
  const weekday = date.getUTCDay();
  const offset = weekday === 0 ? 6 : weekday - 1;
  return nextArgentinaDateYmd(ymd, -offset);
}

function getProductPeriodConfig(period: "day" | "week" | "month", anchorDate: string) {
  if (period === "week") {
    const startYmd = getWeekStartYmd(anchorDate);
    const endYmd = nextArgentinaDateYmd(startYmd, 7);
    return {
      startYmd,
      endYmd,
      startIso: `${startYmd}T00:00:00-03:00`,
      endIso: `${endYmd}T00:00:00-03:00`,
      title: `Semana del ${startYmd} al ${nextArgentinaDateYmd(endYmd, -1)}`,
    };
  }

  if (period === "month") {
    const startYmd = getMonthStartYmd(anchorDate);
    const endYmd = getNextMonthStartYmd(anchorDate);
    return {
      startYmd,
      endYmd,
      startIso: `${startYmd}T00:00:00-03:00`,
      endIso: `${endYmd}T00:00:00-03:00`,
      title: new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(
        new Date(`${startYmd}T12:00:00-03:00`)
      ),
    };
  }

  const { ymd, startIso, endExclusiveIso } = getArgentinaDayRangeUtcIso(anchorDate);
  return {
    startYmd: ymd,
    endYmd: nextArgentinaDateYmd(ymd, 1),
    startIso,
    endIso: endExclusiveIso,
    title: `Día ${ymd}`,
  };
}

function buildProductPerformance(
  items: SaleItemRow[],
  products: ProductListRow[],
  periodTitle: string,
  period: "day" | "week" | "month",
  metric: "quantity" | "revenue",
  anchorDate: string,
  startIso: string,
  endIso: string
): ProductPerformancePayload {
  const aggregated = new Map<
    string,
    { key: string; name: string; quantity: number; revenue: number; saleIds: Set<string> }
  >();

  for (const item of items) {
    const key = item.product_id ? `product:${item.product_id}` : `name:${String(item.name ?? "Producto sin nombre")}`;
    const existing = aggregated.get(key);
    const quantity = toNum(item.quantity);
    const revenue = toNum(item.total);

    if (!existing) {
      aggregated.set(key, {
        key,
        name: String((item as SaleItemRow & { name?: string }).name ?? "Producto sin nombre"),
        quantity,
        revenue,
        saleIds: new Set([item.sale_id]),
      });
      continue;
    }

    existing.quantity += quantity;
    existing.revenue += revenue;
    existing.saleIds.add(item.sale_id);
  }

  const totalRevenue = items.reduce((acc, item) => acc + toNum(item.total), 0);
  const totalUnits = items.reduce((acc, item) => acc + toNum(item.quantity), 0);
  const valueSelector = (row: { quantity: number; revenue: number }) => (metric === "quantity" ? row.quantity : row.revenue);

  const rows: ProductPerformanceRow[] = Array.from(aggregated.values()).map((row) => ({
    key: row.key,
    name: row.name,
    quantity: row.quantity,
    revenue: row.revenue,
    salesCount: row.saleIds.size,
    averagePerSale: row.saleIds.size > 0 ? row.revenue / row.saleIds.size : 0,
    share: totalRevenue > 0 ? (row.revenue / totalRevenue) * 100 : 0,
  }));

  rows.sort((a, b) => {
    const diff = valueSelector(b) - valueSelector(a);
    if (Math.abs(diff) > 0.0001) return diff;
    return b.revenue - a.revenue || a.name.localeCompare(b.name, "es");
  });

  const lowRows = [...rows].sort((a, b) => {
    const diff = valueSelector(a) - valueSelector(b);
    if (Math.abs(diff) > 0.0001) return diff;
    return a.revenue - b.revenue || a.name.localeCompare(b.name, "es");
  });

  const soldProductIds = new Set(
    items.map((item) => item.product_id).filter((value): value is string => Boolean(value))
  );

  const noSalesProducts: ProductWithoutSalesRow[] = products
    .filter((product) => product.active && !soldProductIds.has(product.id))
    .map((product) => ({ id: product.id, name: product.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return {
    period,
    metric,
    anchorDate,
    periodTitle,
    startIso,
    endIso,
    totalProductsSold: rows.length,
    totalUnits,
    totalRevenue,
    topProductName: rows[0]?.name ?? null,
    lowProductName: lowRows[0]?.name ?? null,
    topProducts: rows,
    lowProducts: lowRows,
    noSalesProducts,
  };
}

function SpeedometerGauge({
  value,
  label,
  recommended,
  inverse = false,
}: {
  value: number;
  label: string;
  recommended: string;
  inverse?: boolean;
}) {
  const realValue = Number.isFinite(value) ? value : 0;
  const v = Math.max(0, Math.min(100, realValue));
  // Keep the needle just inside the arc at the extremes so it never gets
  // hidden underneath the rounded end caps. The label still shows the real
  // value, including losses (< 0%) or margins above 100%.
  const needleValue = Math.max(2, Math.min(98, v));

  const W = 260;
  const H = 155;
  const cx = W / 2;
  const cy = H - 20;
  const R = 100;
  const sw = 20;

  function pointOnArc(pct: number, radius: number) {
    const ang = Math.PI * (1 - pct / 100);
    return { x: cx + radius * Math.cos(ang), y: cy - radius * Math.sin(ang) };
  }

  function arcPath(fromPct: number, toPct: number) {
    const p1 = pointOnArc(fromPct, R);
    const p2 = pointOnArc(toPct, R);
    const span = Math.abs(toPct - fromPct);
    const large = span > 50 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${R} ${R} 0 ${large} 1 ${p2.x} ${p2.y}`;
  }

  const needleTip = pointOnArc(needleValue, R - 16);

  const pctText = `${realValue.toFixed(1)}%`;

  return (
    <div className="flex flex-col items-center">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0">
        <defs>
          <filter id="gShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="rgba(0,0,0,0.22)" />
          </filter>
        </defs>

        <path d={arcPath(0, 100)} fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth={sw} strokeLinecap="round" />

        <g filter="url(#gShadow)">
          <path d={arcPath(0, 33)} fill="none" stroke="rgb(239,68,68)" strokeWidth={sw} strokeLinecap="round" />
          <path d={arcPath(33, 66)} fill="none" stroke="rgb(245,158,11)" strokeWidth={sw} strokeLinecap="round" />
          <path d={arcPath(66, 100)} fill="none" stroke="rgb(16,185,129)" strokeWidth={sw} strokeLinecap="round" />
        </g>

        <line
          x1={cx} y1={cy}
          x2={needleTip.x} y2={needleTip.y}
          stroke={inverse ? "#cffafe" : "#0f172a"}
          className="transition-all duration-700 ease-out"
          strokeWidth={5}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 5px rgba(34,211,238,.95))" }}
        />
        <circle cx={cx} cy={cy} r={12} className={inverse ? "fill-cyan-100" : "fill-slate-950 dark:fill-cyan-100"} style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,.8))" }} />
        <circle cx={cx} cy={cy} r={5.5} className={inverse ? "fill-slate-900" : "fill-white dark:fill-slate-900"} />

        <text x={cx} y={cy - 22} textAnchor="middle" className={cn("text-2xl font-bold", inverse ? "fill-white" : "fill-foreground")}>
          {pctText}
        </text>
        <text x={cx} y={cy - 40} textAnchor="middle" className={cn("text-[11px] font-medium", inverse ? "fill-blue-200" : "fill-muted-foreground")}>
          {label}
        </text>
      </svg>
      <div className={cn("mt-1 text-sm", inverse ? "text-blue-100/80" : "text-muted-foreground")}>{recommended}</div>
    </div>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    month?: string;
    productsPeriod?: string;
    productsDate?: string;
    productsMetric?: string;
  }>;
}) {
  const sp = (await searchParams) ?? {};
  const currentArYmd = getArgentinaDayRangeUtcIso().ymd;
  const selectedMonth =
    typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month)
      ? sp.month
      : currentArYmd.slice(0, 7);

  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;

  if (!businessId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Reportes</CardTitle>
            <CardDescription>Primero tenés que crear o seleccionar un negocio.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link className="text-sm underline" href="/app/setup">
              Ir a /app/setup
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [selYear, selMonth] = selectedMonth.split("-").map(Number);
  const monthStartYmd = `${String(selYear).padStart(4, "0")}-${String(selMonth || 1).padStart(2, "0")}-01`;
  const nextMonthYmd =
    (selMonth || 1) === 12
      ? `${String(selYear + 1).padStart(4, "0")}-01-01`
      : `${String(selYear).padStart(4, "0")}-${String((selMonth || 1) + 1).padStart(2, "0")}-01`;
  const { startIso: periodStartIso } = getArgentinaDayRangeUtcIso(monthStartYmd);
  const { startIso: periodEndIso } = getArgentinaDayRangeUtcIso(nextMonthYmd);
  const productsPeriod =
    sp.productsPeriod === "day" || sp.productsPeriod === "week" || sp.productsPeriod === "month"
      ? sp.productsPeriod
      : "day";
  const productsMetric = sp.productsMetric === "revenue" ? "revenue" : "quantity";
  const productsAnchorDate =
    typeof sp.productsDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.productsDate)
      ? sp.productsDate
      : currentArYmd;
  const productPeriodConfig = getProductPeriodConfig(productsPeriod, productsAnchorDate);

  const supabase = await createClient();
  const [
    salesLoadResult,
    { data: fixedExpensesData },
    productSalesLoadResult,
    { data: productsListData },
  ] = await Promise.all([
    loadSalesChunked(supabase, businessId, periodStartIso, periodEndIso, "id,total,status,created_at"),
    supabase
      .from("fixed_expenses")
      .select("id,name,amount,frequency,category,active")
      .eq("business_id", businessId)
      .eq("active", true)
      .gte("created_at", periodStartIso)
      .lt("created_at", periodEndIso)
      .order("created_at", { ascending: false }),
    loadSalesChunked(
      supabase,
      businessId,
      productPeriodConfig.startIso,
      productPeriodConfig.endIso,
      "id,status,created_at",
      "paid"
    ),
    supabase
      .from("products")
      .select("id,name,active")
      .eq("business_id", businessId)
      .eq("active", true)
      .order("name", { ascending: true }),
  ]);

  const sales = salesLoadResult.rows;
  const paidSales = sales.filter((s) => s.status === "paid");
  const paidSaleIds = paidSales.map((s) => s.id);
  const { rows: items, errorMessage: itemsLoadError } = await loadSaleItemsChunked(
    supabase,
    businessId,
    paidSaleIds,
    "sale_id,product_id,quantity,total,created_at"
  );
  const fixedExpenses = (fixedExpensesData ?? []) as FixedExpenseRow[];
  const productSales = (productSalesLoadResult.rows as Array<{ id: string; status: string }>) ?? [];
  const productsList = (productsListData ?? []) as ProductListRow[];

  const productPaidSaleIds = productSales.map((sale) => sale.id);
  const { rows: productItems, errorMessage: productItemsLoadError } = await loadSaleItemsChunked(
    supabase,
    businessId,
    productPaidSaleIds,
    "sale_id,product_id,name,quantity,total,created_at"
  );
  const productPerformance = buildProductPerformance(
    productItems,
    productsList,
    productPeriodConfig.title,
    productsPeriod,
    productsMetric,
    productsAnchorDate,
    productPeriodConfig.startIso,
    productPeriodConfig.endIso
  );

  const uniqueProductIds = Array.from(new Set(items.map((x) => x.product_id).filter(Boolean))) as string[];
  const { rows: productsCost, errorMessage: costLoadError } = await loadProductCostsChunked(
    supabase,
    uniqueProductIds
  );
  const costMap = new Map(productsCost.map((p) => [p.id, toNum(p.cost)]));

  const revenue = paidSales.reduce((acc, s) => acc + toNum(s.total), 0);
  const cogs = items.reduce((acc, it) => acc + toNum(it.quantity) * toNum(costMap.get(String(it.product_id ?? ""))), 0);
  const grossProfit = revenue - cogs;
  const grossMarginPct = revenue > 0 ? grossProfit / revenue : 0;

  const days =
    Math.max(
      1,
      Math.round((Date.parse(periodEndIso) - Date.parse(periodStartIso)) / (1000 * 60 * 60 * 24))
    );
  const fixedExpensesTotal = fixedExpenses.reduce((acc, e) => acc + fixedExpenseForPeriod(e, days), 0);
  const netProfit = grossProfit - fixedExpensesTotal;
  const netMarginPct = revenue > 0 ? netProfit / revenue : 0;

  const netGaugeRaw = netMarginPct * 100;
  const netGauge = Math.round(netGaugeRaw * 10) / 10;

  const exportPayload = {
    monthKey: selectedMonth,
    periodTitle: periodLabel(selectedMonth),
    days,
    paidSalesCount: paidSales.length,
    revenue,
    cogs,
    grossProfit,
    grossMarginPct,
    fixedExpensesTotal,
    netProfit,
    netMarginPct,
    netGauge,
    sales: paidSales.map((s) => ({
      id: s.id,
      total: toNum(s.total),
      created_at: s.created_at,
    })),
    fixedExpenses: fixedExpenses.map((e) => ({
      name: e.name,
      amount: toNum(e.amount),
      frequencyLabel: translateFrequency(e.frequency),
      category: e.category ?? "",
      periodAmount: fixedExpenseForPeriod(e, days),
    })),
  };

  return (
    <div className="mx-auto w-full max-w-7xl bg-[#f5f8fc] px-4 pb-28 pt-5 md:bg-transparent md:py-10 dark:bg-slate-950 md:dark:bg-transparent">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-[27px] font-extrabold tracking-tight md:text-2xl md:font-semibold">Reportes</h1>
          <p className="text-xs text-muted-foreground md:text-sm">Ventas, costos, gastos y ganancia neta.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:mt-3 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none dark:border-slate-800 dark:bg-slate-900 md:dark:bg-transparent">
        <div className="text-xs font-bold capitalize text-blue-600 md:font-normal md:text-muted-foreground">{periodLabel(selectedMonth)}</div>
        <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
          <div className="hidden flex-wrap items-center gap-2 md:flex">
            <ReportsExportButton data={exportPayload} />
            <span className="hidden max-w-[220px] text-xs text-muted-foreground md:inline">
              Excel con estilo: resumen del mes, ventas cobradas y gastos fijos (según el mes elegido).
            </span>
          </div>
          <form method="get" className="flex w-full items-center gap-2 md:w-auto">
            <Label htmlFor="month" className="text-xs text-muted-foreground">Mes</Label>
            <Input id="month" name="month" type="month" defaultValue={selectedMonth} className="h-10 min-w-0 flex-1 rounded-xl md:h-9 md:w-44 md:flex-none" />
            <button className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white md:h-9 md:border md:bg-transparent md:px-3 md:font-normal md:text-foreground">Ver</button>
          </form>
        </div>
      </div>

      <section className="reports-primary-gauge relative mt-5 overflow-hidden rounded-3xl border border-cyan-300/30 text-white shadow-[0_24px_65px_-32px_rgba(30,64,175,.9)] md:items-stretch">
        <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-20 size-64 rounded-full border-[38px] border-cyan-300/10" />
        <div className="relative flex min-h-[245px] items-center justify-center border-cyan-300/15 p-5 md:border-r">
          <SpeedometerGauge value={netGauge} label="Margen neto" recommended="Objetivo recomendado: 15%+" inverse />
        </div>

        <div className="relative flex flex-col justify-center p-7 lg:p-9">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/15 text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,.16)]">
              <TrendingUp className="size-6" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-200">Resultado del período</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-blue-100">{netProfit >= 0 ? "Tu ganancia neta fue" : "Tu pérdida neta fue"}</h2>
              <p className={cn("mt-1 text-4xl font-black tabular-nums lg:text-5xl", netProfit >= 0 ? "text-[#39ff14]" : "text-rose-300")}>{moneyAr(netProfit)}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Ventas brutas</p>
              <p className="mt-2 text-xl font-black tabular-nums text-cyan-200 lg:text-2xl">{moneyAr(revenue)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Costo de mercadería</p>
              <p className="mt-2 text-xl font-black tabular-nums text-amber-300 lg:text-2xl">{moneyAr(cogs)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Gastos fijos</p>
              <p className="mt-2 text-xl font-black tabular-nums text-rose-300 lg:text-2xl">{moneyAr(fixedExpensesTotal)}</p>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-blue-100/75">
            {moneyAr(revenue)} en ventas − {moneyAr(cogs)} de mercadería − {moneyAr(fixedExpensesTotal)} de gastos = <strong className="text-white">{moneyAr(netProfit)} netos</strong>.
          </p>
          <ExpenseModalButton
            label={`Cargar gastos de ${periodLabel(selectedMonth)}`}
            month={selectedMonth}
            monthLabel={periodLabel(selectedMonth)}
          />
        </div>
      </section>

      <section className="mt-4 space-y-4 md:hidden">
        <article className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-[0_12px_28px_rgba(8,126,231,.16)] dark:border-blue-900/70 dark:bg-slate-900">
          <div className="bg-gradient-to-br from-[#0799ee] via-[#087fe8] to-[#0867d6] px-5 py-4 text-white"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-white/15 shadow-inner"><TrendingUp className="size-6" /></span><div><p className="text-sm font-extrabold">Margen de ganancia neto</p><p className="mt-0.5 text-[10px] font-medium text-blue-100">KPI principal del período seleccionado</p></div></div></div>
          <div className="p-4">
            <div className="flex justify-center overflow-hidden"><SpeedometerGauge value={netGauge} label="% neto" recommended="Objetivo recomendado: 15%+" /></div>
            <div className={cn("mt-1 rounded-2xl border px-4 py-3 text-center", netProfit >= 0 ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 dark:border-emerald-900 dark:from-emerald-950/40 dark:to-teal-950/30" : "border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 dark:border-rose-900 dark:from-rose-950/40 dark:to-red-950/30")}>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">{netProfit >= 0 ? "Ganancia total" : "Pérdida total"}</p>
              <p className={cn("mt-1 break-words text-2xl font-black leading-none tabular-nums", netProfit >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")}>{moneyAr(netProfit)}</p>
            </div>
          </div>
        </article>

        <div className="grid grid-cols-2 gap-3">
          {[
            ["Ventas", moneyAr(revenue), "bg-sky-100 text-sky-600 dark:bg-sky-950", <TrendingUp key="sales" className="size-5" />],
            ["Mercadería", moneyAr(cogs), "bg-violet-100 text-violet-600 dark:bg-violet-950", <ShoppingBag key="cogs" className="size-5" />],
            ["Ganancia bruta", moneyAr(grossProfit), "bg-amber-100 text-amber-600 dark:bg-amber-950", <Scale key="profit" className="size-5" />],
            ["Gastos fijos", moneyAr(fixedExpensesTotal), "bg-rose-100 text-rose-600 dark:bg-rose-950", <Receipt key="expenses" className="size-5" />],
          ].map(([label, value, tone, icon]) => <article key={String(label)} className="flex min-h-28 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_5px_18px_rgba(15,23,42,.07)] dark:border-slate-800 dark:bg-slate-900"><span className={cn("flex size-11 items-center justify-center rounded-xl shadow-inner", String(tone))}>{icon}</span><div><p className="mt-3 text-[10px] font-extrabold text-slate-500 dark:text-slate-400">{label}</p><p className="mt-0.5 truncate text-base font-black tabular-nums text-slate-950 dark:text-white">{value}</p></div></article>)}
        </div>

        <article className="rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 to-white p-4 shadow-[0_5px_18px_rgba(15,23,42,.06)] dark:border-amber-900/50 dark:from-amber-950/40 dark:to-slate-900">
          <div className="flex items-center gap-3"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950"><Scale className="size-6" /></span><div className="min-w-0"><h2 className="text-sm font-extrabold">Resultado bruto</h2><p className="mt-0.5 text-xl font-black text-amber-600 tabular-nums">{moneyAr(grossProfit)}</p><p className="text-[10px] text-slate-500 dark:text-slate-400">Margen bruto {pct(grossMarginPct)} antes de gastos fijos</p></div></div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_5px_18px_rgba(15,23,42,.06)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800"><div><h2 className="text-sm font-extrabold">Productos destacados</h2><p className="text-[10px] text-slate-500">Los que más facturaron</p></div><span className="flex size-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shadow-inner dark:bg-blue-950"><Package className="size-4" /></span></div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {productPerformance.topProducts.length === 0 ? <p className="px-4 py-8 text-center text-xs text-slate-500">Todavía no hay ventas en este período.</p> : productPerformance.topProducts.slice(0, 5).map((product, index) => <div key={product.key} className="flex items-center gap-3 px-4 py-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-extrabold text-blue-600 dark:bg-blue-950">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold">{product.name}</p><p className="mt-0.5 text-[9px] text-slate-500">{product.quantity.toLocaleString("es-AR")} unidades · {product.salesCount} tickets</p></div><p className="text-xs font-extrabold text-emerald-600">{moneyAr(product.revenue)}</p></div>)}
          </div>
        </article>

        <div className="flex justify-center"><ReportsExportButton data={exportPayload} /></div>
      </section>

      {costLoadError ? (
        <div className="mt-4 rounded-2xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">No se pudo calcular correctamente el costo de mercadería</p>
          <p className="mt-1 text-destructive/90">
            {costLoadError} Revisá este período nuevamente o intentá con un rango más corto mientras seguimos mejorando este reporte.
          </p>
        </div>
      ) : null}

      {itemsLoadError ? (
        <div className="mt-4 rounded-2xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">No se pudo cargar el detalle de ventas para este período</p>
          <p className="mt-1 text-destructive/90">
            {itemsLoadError} Sin ese detalle, el costo de mercadería puede verse en cero.
          </p>
        </div>
      ) : null}

      {salesLoadResult.errorMessage ? (
        <div className="mt-4 rounded-2xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">No se pudieron cargar todas las ventas del período</p>
          <p className="mt-1 text-destructive/90">
            {salesLoadResult.errorMessage}
          </p>
        </div>
      ) : null}

      {productSalesLoadResult.errorMessage ? (
        <div className="mt-4 rounded-2xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">No se pudieron cargar todas las ventas del ranking de productos</p>
          <p className="mt-1 text-destructive/90">
            {productSalesLoadResult.errorMessage}
          </p>
        </div>
      ) : null}

      {productItemsLoadError ? (
        <div className="mt-4 rounded-2xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">No se pudo cargar el ranking completo de productos</p>
          <p className="mt-1 text-destructive/90">
            {productItemsLoadError} Probá con un período más corto si necesitás revisar solo productos vendidos.
          </p>
        </div>
      ) : null}

      <div className="mt-4 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:block md:bg-card md:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">Consulta de productos vendidos</div>
            <div className="text-xs text-muted-foreground">
              Elegí período y fecha base. El ranking arranca en top 10, pero lo podés expandir.
            </div>
          </div>
          <form method="get" className="grid w-full grid-cols-2 items-end gap-2 md:flex md:w-auto md:flex-wrap md:gap-3">
            <input type="hidden" name="month" value={selectedMonth} />
            <div className="grid gap-1">
              <Label htmlFor="productsPeriod" className="text-xs text-muted-foreground">Período</Label>
              <select
                id="productsPeriod"
                name="productsPeriod"
                defaultValue={productsPeriod}
                className="h-10 w-full rounded-xl border border-input bg-transparent px-3 text-sm md:h-9 md:rounded-md"
              >
                <option value="day">Día</option>
                <option value="week">Semana</option>
                <option value="month">Mes</option>
              </select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="productsDate" className="text-xs text-muted-foreground">Fecha base</Label>
              <Input
                id="productsDate"
                name="productsDate"
                type="date"
                defaultValue={productsAnchorDate}
                className="h-10 w-full rounded-xl md:h-9 md:w-44"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="productsMetric" className="text-xs text-muted-foreground">Ordenar por</Label>
              <select
                id="productsMetric"
                name="productsMetric"
                defaultValue={productsMetric}
                className="h-10 w-full rounded-xl border border-input bg-transparent px-3 text-sm md:h-9 md:rounded-md"
              >
                <option value="quantity">Cantidad</option>
                <option value="revenue">Facturación</option>
              </select>
            </div>
            <button className="h-10 rounded-xl bg-gradient-to-r from-[#075dcc] to-[#4b45cf] px-3 text-sm font-bold text-white md:h-9 md:border md:bg-none md:font-normal md:text-foreground">Consultar</button>
          </form>
        </div>
      </div>

      <div className="mt-6 hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-6">
        <Card className="xl:col-span-2 relative overflow-hidden border-l-4 border-l-sky-500 border-sky-500/10 bg-sky-500/[0.03] dark:bg-sky-500/[0.07]">
          <TrendingUp className="absolute -right-2 -top-2 size-24 text-sky-500/10 dark:text-sky-500/20" />
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-sky-500/10 p-1.5 dark:bg-sky-500/20">
                <TrendingUp className="size-4 text-sky-600 dark:text-sky-400" />
              </div>
              <CardDescription className="font-medium text-sky-900/60 dark:text-sky-400/60">Ventas</CardDescription>
            </div>
            <CardTitle className="text-2xl pt-1">{moneyAr(revenue)}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-violet-500 border-violet-500/10 bg-violet-500/[0.03] dark:bg-violet-500/[0.07]">
          <ShoppingBag className="absolute -right-2 -top-2 size-24 text-violet-500/10 dark:text-violet-500/20" />
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-violet-500/10 p-1.5 dark:bg-violet-500/20">
                <ShoppingBag className="size-4 text-violet-600 dark:text-violet-400" />
              </div>
              <CardDescription className="font-medium text-violet-900/60 dark:text-violet-400/60">Costo mercadería</CardDescription>
            </div>
            <CardTitle className="text-2xl pt-1">{moneyAr(cogs)}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-amber-500 border-amber-500/10 bg-amber-500/[0.03] dark:bg-amber-500/[0.07]">
          <Scale className="absolute -right-2 -top-2 size-24 text-amber-500/10 dark:text-amber-500/20" />
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-500/10 p-1.5 dark:bg-amber-500/20">
                <Scale className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <CardDescription className="font-medium text-amber-900/60 dark:text-amber-400/60">Margen bruto</CardDescription>
            </div>
            <CardTitle className="text-2xl pt-1">{moneyAr(grossProfit)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs font-bold text-amber-600 dark:text-amber-400">
            {pct(grossMarginPct)}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-slate-500 border-slate-500/10 bg-slate-500/[0.03] dark:bg-slate-500/[0.07]">
          <Receipt className="absolute -right-2 -top-2 size-24 text-slate-500/10 dark:text-slate-500/20" />
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-slate-500/10 p-1.5 dark:bg-slate-500/20">
                <Receipt className="size-4 text-slate-600 dark:text-slate-400" />
              </div>
              <CardDescription className="font-medium text-slate-900/60 dark:text-slate-400/60">Gastos fijos</CardDescription>
            </div>
            <CardTitle className="text-2xl pt-1">{moneyAr(fixedExpensesTotal)}</CardTitle>
          </CardHeader>
        </Card>

        <Card className={cn(
          "relative overflow-hidden border-l-4 shadow-sm",
          netProfit >= 0 
            ? "border-l-emerald-500 border-emerald-500/10 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.07]" 
            : "border-l-rose-500 border-rose-500/10 bg-rose-500/[0.03] dark:bg-rose-500/[0.07]"
        )}>
          <Wallet className={cn(
            "absolute -right-2 -top-2 size-24",
            netProfit >= 0 ? "text-emerald-500/10 dark:text-emerald-500/20" : "text-rose-500/10 dark:text-rose-500/20"
          )} />
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                "rounded-lg p-1.5",
                netProfit >= 0 ? "bg-emerald-500/10 dark:bg-emerald-500/20" : "bg-rose-500/10 dark:bg-rose-500/20"
              )}>
                <Wallet className={cn("size-4", netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")} />
              </div>
              <CardDescription className={cn(
                "font-medium",
                netProfit >= 0 ? "text-emerald-900/60 dark:text-emerald-400/60" : "text-rose-900/60 dark:text-rose-400/60"
              )}>Ganancia neta</CardDescription>
            </div>
            <CardTitle className="text-2xl pt-1">{moneyAr(netProfit)}</CardTitle>
          </CardHeader>
          <CardContent className={cn(
            "pt-0 text-xs font-bold",
            netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          )}>
            {pct(netMarginPct)}
          </CardContent>
        </Card>
      </div>

      <div className="hidden md:block"><ProductPerformanceClient data={productPerformance} /></div>

      <div className="mt-4 hidden gap-4 md:mt-6 md:grid xl:grid-cols-3">
        <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm xl:col-span-2 dark:border-slate-800 md:shadow-none">
          <CardHeader>
            <CardTitle>Margen de ganancia neto</CardTitle>
            <CardDescription>KPI principal del período seleccionado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 md:items-center">
              <SpeedometerGauge value={netGauge} label="% neto" recommended="Objetivo recomendado: 15%+" />

              <div className="grid gap-3">
                <div className="rounded-xl border bg-card p-4">
                  <div className="text-xs text-muted-foreground">Resultado neto</div>
                  <div className={"mt-1 text-2xl font-semibold " + (netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                    {moneyAr(netProfit)}
                  </div>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <div className="text-xs text-muted-foreground">Margen bruto</div>
                  <div className="mt-1 text-lg font-semibold">{moneyAr(grossProfit)} · {pct(grossMarginPct)}</div>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <div className="text-xs text-muted-foreground">Fórmula</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Ventas {moneyAr(revenue)} - Costo mercadería {moneyAr(cogs)} - Gastos {moneyAr(fixedExpensesTotal)}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">Reporte mensual del período seleccionado.</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card id="fixed-expenses" className="scroll-mt-24 rounded-2xl border-slate-200 shadow-sm dark:border-slate-800 md:shadow-none">
          <CardHeader>
            <CardTitle>Gastos fijos de {periodLabel(selectedMonth)}</CardTitle>
            <CardDescription>Cargá los costos correspondientes únicamente a este mes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={createFixedExpense} className="grid gap-3">
              <input type="hidden" name="month" value={selectedMonth} />
              <div className="grid gap-1.5">
                <Label htmlFor="name">Concepto</Label>
                <Input id="name" name="name" placeholder="Alquiler, internet, sueldos..." required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="amount">Monto</Label>
                <Input id="amount" name="amount" type="number" step="0.01" required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="frequency">Frecuencia</Label>
                <select id="frequency" name="frequency" className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" defaultValue="monthly">
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="category">Categoría (opcional)</Label>
                <Input id="category" name="category" placeholder="Operativo, administración..." />
              </div>
              <button className="h-10 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">Agregar gasto</button>
            </form>

            <div className="grid gap-2">
              {fixedExpenses.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No hay gastos cargados para {periodLabel(selectedMonth)}.</div>
              ) : (
                fixedExpenses.map((e) => (
                  <div key={e.id} className="rounded-lg border p-2">
                    <div className="grid gap-2">
                      <form action={updateFixedExpense} className="grid gap-2 md:grid-cols-4">
                        <input type="hidden" name="id" value={e.id} />
                        <Input name="name" defaultValue={e.name} className="h-8 text-xs" />
                        <Input name="amount" type="number" step="0.01" defaultValue={toNum(e.amount)} className="h-8 text-xs" />
                        <select
                          name="frequency"
                          defaultValue={e.frequency}
                          className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                        >
                          <option value="daily">Diario</option>
                          <option value="weekly">Semanal</option>
                          <option value="monthly">Mensual</option>
                        </select>
                        <Input name="category" defaultValue={e.category ?? ""} className="h-8 text-xs" placeholder="Categoría" />
                        <div className="md:col-span-4 flex items-center justify-between gap-2">
                          <div className="text-xs text-muted-foreground">
                            {moneyAr(toNum(e.amount))} · {translateFrequency(e.frequency)}
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="rounded-md border px-2 py-1 text-xs">Guardar</button>
                          </div>
                        </div>
                      </form>
                      <form action={deleteFixedExpense} className="flex justify-end">
                        <input type="hidden" name="id" value={e.id} />
                        <button className="rounded-md border px-2 py-1 text-xs">Eliminar</button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
