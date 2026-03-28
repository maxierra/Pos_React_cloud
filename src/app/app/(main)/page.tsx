import { cookies } from "next/headers";
import { AlertTriangle, Banknote, CreditCard, Landmark, Receipt, ShoppingCart, TrendingUp, Wallet } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { DateSelector } from "./date-selector";

type SaleRow = {
  id: string;
  total: number | string;
  payment_method: string;
  payment_details?: unknown;
  status: string;
  created_at: string;
};

type SaleItemRow = {
  id: string;
  sale_id: string;
  name: string;
  quantity: number | string;
  total: number | string;
  unit_price: number | string;
  product_id: string | null;
  created_at: string;
};

type ProductRow = {
  id: string;
  name: string;
  stock: number | string;
  stock_decimal: number | string;
  sold_by_weight: boolean;
  low_stock_threshold: number | string;
  low_stock_threshold_decimal: number | string;
  active: boolean;
};

type CashMovementRow = {
  id: string;
  movement_type: "in" | "out";
  payment_method: "cash" | "card" | "transfer" | "mercadopago";
  amount: number | string;
};

type MethodTotals = {
  cash: number;
  card: number;
  transfer: number;
  mercadopago: number;
};

function toNum(value: number | string | null | undefined) {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function moneyAr(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

function fmtDateShort(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
  }).format(d);
}

function splitFromDetails(details: unknown): Array<{ method: string; amount: number }> {
  if (!details || typeof details !== "object") return [];
  const raw = (details as Record<string, unknown>).split;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => {
      const obj = x as Record<string, unknown>;
      return {
        method: String(obj?.method ?? ""),
        amount: toNum(obj?.amount as number | string | null | undefined),
      };
    })
    .filter((x) => x.amount > 0 && x.method.length > 0);
}

function addSaleToMethodTotals(s: SaleRow, acc: MethodTotals) {
  if (s.status !== "paid") return;
  const total = toNum(s.total);
  if (s.payment_method === "mixed") {
    const split = splitFromDetails(s.payment_details);
    for (const part of split) {
      if (part.method in acc) (acc as any)[part.method] += part.amount;
    }
    return;
  }
  if (s.payment_method in acc) (acc as any)[s.payment_method] += total;
}

export default async function AppHomePage(props: { searchParams: Promise<{ date?: string }> }) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;
  const hasSupabaseEnv =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const demoEmail = cookieStore.get("demo_user_email")?.value;

  const userEmail = hasSupabaseEnv
    ? (await (await createClient()).auth.getUser()).data.user?.email
    : demoEmail;

  if (!businessId) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="rounded-2xl border bg-card p-6">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seleccioná o creá un negocio para ver métricas del panel.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const dateParam = searchParams.date;
  const now = dateParam ? new Date(`${dateParam}T12:00:00`) : new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const trendStart = new Date(todayStart);
  trendStart.setDate(trendStart.getDate() - 6);

  const [{ data: todaySalesData }, { data: trendSalesData }, { data: todayItemsData }, { data: productsData }, { data: openRegisterData }] =
    await Promise.all([
      supabase
        .from("sales")
        .select("id,total,payment_method,payment_details,status,created_at")
        .eq("business_id", businessId)
        .gte("created_at", todayStart.toISOString())
        .lt("created_at", tomorrow.toISOString()),
      supabase
        .from("sales")
        .select("id,total,payment_method,payment_details,status,created_at")
        .eq("business_id", businessId)
        .gte("created_at", trendStart.toISOString())
        .lt("created_at", tomorrow.toISOString()),
      supabase
        .from("sale_items")
        .select("id,sale_id,name,quantity,total,unit_price,product_id,created_at")
        .eq("business_id", businessId)
        .gte("created_at", todayStart.toISOString())
        .lt("created_at", tomorrow.toISOString()),
      supabase
        .from("products")
        .select("id,name,stock,stock_decimal,sold_by_weight,low_stock_threshold,low_stock_threshold_decimal,active")
        .eq("business_id", businessId)
        .eq("active", true)
        .limit(300),
      supabase
        .from("cash_registers")
        .select("id,opened_at,opening_amount,closed_at")
        .eq("business_id", businessId)
        .is("closed_at", null)
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const todaySales = ((todaySalesData ?? []) as SaleRow[]).filter((s) => s.status === "paid");
  const trendSales = (trendSalesData ?? []) as SaleRow[];
  const todayItems = (todayItemsData ?? []) as SaleItemRow[];
  const products = (productsData ?? []) as ProductRow[];
  const openRegister = openRegisterData as
    | { id: string; opened_at: string; opening_amount: number | string; closed_at: string | null }
    | null;

  const todayRevenue = todaySales.reduce((acc, s) => acc + toNum(s.total), 0);
  const todayTickets = todaySales.length;
  const averageTicket = todayTickets > 0 ? todayRevenue / todayTickets : 0;
  const todayVoids = ((todaySalesData ?? []) as SaleRow[]).filter((s) => s.status === "voided");
  const todayVoidsAmount = todayVoids.reduce((acc, s) => acc + toNum(s.total), 0);

  const methodsToday: MethodTotals = { cash: 0, card: 0, transfer: 0, mercadopago: 0 };
  for (const s of todaySales) addSaleToMethodTotals(s, methodsToday);

  const salesByDay = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(trendStart);
    d.setDate(trendStart.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    salesByDay.set(key, 0);
  }
  for (const s of trendSales) {
    if (s.status !== "paid") continue;
    const key = s.created_at.slice(0, 10);
    if (!salesByDay.has(key)) continue;
    salesByDay.set(key, (salesByDay.get(key) ?? 0) + toNum(s.total));
  }
  const trendPoints = Array.from(salesByDay.entries()).map(([date, total]) => ({ date, total }));
  const trendMax = Math.max(1, ...trendPoints.map((x) => x.total));

  const todayPaidSaleIds = new Set(todaySales.map((s) => s.id));
  const topProductsMap = new Map<string, { name: string; qty: number; total: number }>();
  for (const it of todayItems) {
    if (!todayPaidSaleIds.has(it.sale_id)) continue;
    const key = it.product_id ?? it.name;
    const prev = topProductsMap.get(key);
    const qty = toNum(it.quantity);
    const ttl = toNum(it.total);
    if (!prev) {
      topProductsMap.set(key, { name: it.name, qty, total: ttl });
      continue;
    }
    prev.qty += qty;
    prev.total += ttl;
  }
  const topProducts = Array.from(topProductsMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const lowStockProducts = products
    .filter((p) => {
      if (p.sold_by_weight) {
        return toNum(p.stock_decimal) <= toNum(p.low_stock_threshold_decimal);
      }
      return toNum(p.stock) <= toNum(p.low_stock_threshold);
    })
    .slice(0, 8);

  let cashExpected = 0;
  let registerMethodTotals: MethodTotals = { cash: 0, card: 0, transfer: 0, mercadopago: 0 };
  if (openRegister) {
    const [{ data: registerSalesData }, { data: registerMovementsData }] = await Promise.all([
      supabase
        .from("sales")
        .select("id,total,payment_method,payment_details,status,created_at")
        .eq("business_id", businessId)
        .eq("cash_register_id", openRegister.id),
      supabase
        .from("cash_movements")
        .select("id,movement_type,payment_method,amount")
        .eq("business_id", businessId)
        .eq("cash_register_id", openRegister.id),
    ]);
    const registerSales = (registerSalesData ?? []) as SaleRow[];
    const registerMovements = (registerMovementsData ?? []) as CashMovementRow[];
    for (const s of registerSales) addSaleToMethodTotals(s, registerMethodTotals);
    for (const m of registerMovements) {
      const sign = m.movement_type === "in" ? 1 : -1;
      registerMethodTotals[m.payment_method] += sign * toNum(m.amount);
    }
    cashExpected = toNum(openRegister.opening_amount) + registerMethodTotals.cash;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Usuario: {userEmail ?? "-"} | Business: {businessId ?? "-"}
          </p>
        </div>
        <DateSelector />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="inline-flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <TrendingUp className="size-4" /> Ventas de hoy
          </div>
          <div className="mt-2 text-3xl font-semibold text-emerald-700 dark:text-emerald-300">{moneyAr(todayRevenue)}</div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Receipt className="size-4" /> Tickets
          </div>
          <div className="mt-2 text-3xl font-semibold">{todayTickets}</div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingCart className="size-4" /> Ticket promedio
          </div>
          <div className="mt-2 text-3xl font-semibold">{moneyAr(averageTicket)}</div>
        </div>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-5">
          <div className="inline-flex items-center gap-2 text-sm text-rose-700 dark:text-rose-300">
            <AlertTriangle className="size-4" /> Anulaciones hoy
          </div>
          <div className="mt-2 text-3xl font-semibold text-rose-700 dark:text-rose-300">{todayVoids.length}</div>
          <div className="mt-1 text-xs text-rose-700/80 dark:text-rose-300/80">{moneyAr(todayVoidsAmount)}</div>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="inline-flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
            <Wallet className="size-4" /> Caja actual
          </div>
          <div className="mt-2 text-3xl font-semibold text-amber-700 dark:text-amber-300">{moneyAr(cashExpected)}</div>
          <div className="mt-1 text-xs text-amber-700/80 dark:text-amber-300/80">
            {openRegister ? "Turno abierto" : "Sin caja abierta"}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-xl border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium">Ventas últimos 7 días</div>
            <div className="text-xs text-muted-foreground">Tendencia diaria</div>
          </div>
          <div className="grid grid-cols-7 items-end gap-2">
            {trendPoints.map((p) => {
              const h = Math.max(8, Math.round((p.total / trendMax) * 160));
              return (
                <div key={p.date} className="flex flex-col items-center gap-1">
                  <div className="text-[10px] text-muted-foreground">{moneyAr(p.total)}</div>
                  <div className="w-full rounded-md bg-primary/10 px-1">
                    <div className="mx-auto w-full rounded-sm bg-primary" style={{ height: `${h}px` }} />
                  </div>
                  <div className="text-[10px] text-muted-foreground">{fmtDateShort(p.date)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="mb-3 text-sm font-medium">Métodos de pago hoy</div>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2">
              <span className="inline-flex items-center gap-1.5"><Banknote className="size-3.5" />Efectivo</span>
              <span className="font-semibold">{moneyAr(methodsToday.cash)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[var(--pos-amber)]/10 px-3 py-2">
              <span className="inline-flex items-center gap-1.5"><CreditCard className="size-3.5" />Tarjeta</span>
              <span className="font-semibold">{moneyAr(methodsToday.card)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-violet-500/10 px-3 py-2">
              <span className="inline-flex items-center gap-1.5"><Landmark className="size-3.5" />Transferencia</span>
              <span className="font-semibold">{moneyAr(methodsToday.transfer)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-sky-500/10 px-3 py-2">
              <span>Mercado Pago</span>
              <span className="font-semibold">{moneyAr(methodsToday.mercadopago)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-3 text-sm font-medium">Top productos de hoy</div>
          <div className="grid gap-2">
            {topProducts.length === 0 ? (
              <div className="text-sm text-muted-foreground">Sin ventas hoy.</div>
            ) : (
              topProducts.map((p) => (
                <div key={p.name} className="rounded-lg border bg-background px-3 py-2">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Cant: {p.qty.toFixed(2)}</span>
                    <span className="font-semibold text-foreground">{moneyAr(p.total)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="mb-3 text-sm font-medium">Alertas de stock bajo</div>
          <div className="grid gap-2">
            {lowStockProducts.length === 0 ? (
              <div className="text-sm text-emerald-600 dark:text-emerald-400">Sin alertas de stock.</div>
            ) : (
              lowStockProducts.map((p) => (
                <div key={p.id} className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Stock: {p.sold_by_weight ? toNum(p.stock_decimal).toFixed(3) : toNum(p.stock)} · Umbral:{" "}
                    {p.sold_by_weight ? toNum(p.low_stock_threshold_decimal).toFixed(3) : toNum(p.low_stock_threshold)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="mb-3 text-sm font-medium">Estado de caja</div>
          {!openRegister ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No hay turno abierto. Abrí caja para controlar movimientos en tiempo real.
            </div>
          ) : (
            <div className="grid gap-2 text-sm">
              <div className="rounded-lg bg-primary/5 px-3 py-2">
                <div className="text-xs text-muted-foreground">Apertura</div>
                <div className="font-medium">{fmtDateShort(openRegister.opened_at)}</div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2">
                <span>Efectivo esperado</span>
                <span className="font-semibold">{moneyAr(cashExpected)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[var(--pos-amber)]/10 px-3 py-2">
                <span>Tarjeta neto turno</span>
                <span className="font-semibold">{moneyAr(registerMethodTotals.card)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-violet-500/10 px-3 py-2">
                <span>Transferencia neto</span>
                <span className="font-semibold">{moneyAr(registerMethodTotals.transfer)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
