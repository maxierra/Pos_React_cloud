import { CalendarDays, CircleDollarSign, Monitor, MousePointerClick, ShoppingCart } from "lucide-react";

import { DownloadChart, type DownloadChartPoint } from "@/app/admin/(dashboard)/descargas/download-chart";
import { PaymentsChart, type PaymentDay } from "@/app/admin/(dashboard)/descargas/payments-chart";
import { ProvinceChart, type ProvinceChartPoint } from "@/app/admin/(dashboard)/descargas/province-chart";
import { DeleteStoreSaleButton, QuickStoreSaleForm, StoreSaleForm } from "@/app/admin/(dashboard)/descargas/store-sales-form";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type StoreClick = { id: string; location: string; device: string; country_code: string | null; region: string | null; city: string | null; created_at: string };
type StoreSale = { id: string; sale_date: string; quantity: number; total_amount: number | string; note: string | null; created_at: string };

const TZ = "America/Argentina/Buenos_Aires";
const storeLocationLabels: Record<string, string> = { header: "Encabezado", hero: "Botón principal", hero_certificate: "Insignia certificada", store_band: "Franja Microsoft Store", mobile_share: "Enlace compartido desde celular" };

function dayKey(value: string | Date) { return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value)); }
function dayLabel(value: string) { return new Date(`${value}T12:00:00-03:00`).toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short" }); }
function weekKey(value: string) { const date = new Date(`${dayKey(value)}T12:00:00Z`); date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7)); return date.toISOString().slice(0, 10); }
function monthKey(value: string) { return dayKey(value).slice(0, 7); }
function points(map: Map<string, number>, limit: number, label: (key: string) => string): DownloadChartPoint[] { return [...map].sort(([a], [b]) => a.localeCompare(b)).slice(-limit).map(([key, descargas]) => ({ key, label: label(key), descargas })); }
function money(value: number) { return `$${value.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`; }

export default async function AdminDownloadsPage() {
  const admin = createAdminClient();
  const [{ data: clickData, error: clickError }, { data: saleData, error: saleError }] = await Promise.all([
    admin.from("microsoft_store_click_events").select("id,location,device,country_code,region,city,created_at").order("created_at", { ascending: false }).limit(5000),
    admin.from("microsoft_store_sales").select("id,sale_date,quantity,total_amount,note,created_at").order("sale_date", { ascending: false }).order("created_at", { ascending: false }).limit(1000),
  ]);
  const clicks = (clickData ?? []) as StoreClick[];
  const sales = (saleData ?? []) as StoreSale[];
  const nowIso = new Date().toISOString();
  const today = dayKey(nowIso);
  const thisWeek = weekKey(nowIso);
  const thisMonth = monthKey(nowIso);
  const daily = new Map<string, number>();
  const weekly = new Map<string, number>();
  const monthly = new Map<string, number>();
  const byLocation = new Map<string, number>();
  for (const click of clicks) {
    const day = dayKey(click.created_at); const week = weekKey(click.created_at); const month = monthKey(click.created_at);
    daily.set(day, (daily.get(day) ?? 0) + 1); weekly.set(week, (weekly.get(week) ?? 0) + 1); monthly.set(month, (monthly.get(month) ?? 0) + 1); byLocation.set(click.location, (byLocation.get(click.location) ?? 0) + 1);
  }
  const salesThisWeek = sales.filter((sale) => sale.sale_date >= thisWeek);
  const salesThisMonth = sales.filter((sale) => sale.sale_date.startsWith(thisMonth));
  const quantityThisWeek = salesThisWeek.reduce((sum, sale) => sum + sale.quantity, 0);
  const revenueThisWeek = salesThisWeek.reduce((sum, sale) => sum + (sale.quantity * Number(sale.total_amount)), 0);
  const quantityThisMonth = salesThisMonth.reduce((sum, sale) => sum + sale.quantity, 0);
  const clicksThisWeek = clicks.filter((click) => weekKey(click.created_at) === thisWeek).length;
  const clicksThisMonth = clicks.filter((click) => monthKey(click.created_at) === thisMonth).length;
  const clicksThisMonthRows = clicks.filter((click) => monthKey(click.created_at) === thisMonth);
  const provinceCounts = new Map<string, number>();
  let unknownProvinceClicks = 0;
  for (const click of clicksThisMonthRows) {
    if (click.country_code !== "AR" || !click.region) {
      unknownProvinceClicks += 1;
      continue;
    }
    provinceCounts.set(click.region, (provinceCounts.get(click.region) ?? 0) + 1);
  }
  const provinceData: ProvinceChartPoint[] = [...provinceCounts]
    .sort(([, a], [, b]) => b - a)
    .map(([province, clickCount]) => ({ province, clicks: clickCount }));
  const paymentDays: PaymentDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${thisWeek}T12:00:00-03:00`); date.setDate(date.getDate() + index); const day = dayKey(date); const rows = sales.filter((sale) => sale.sale_date === day);
    return { day, label: dayLabel(day), payments: rows.reduce((sum, row) => sum + row.quantity, 0), amount: rows.reduce((sum, row) => sum + (row.quantity * Number(row.total_amount)), 0) };
  });
  const recentDays = [...daily].sort(([a], [b]) => b.localeCompare(a)).slice(0, 14);

  return <div className="mx-auto w-full max-w-7xl space-y-7 px-4 py-8">
    <header><p className="text-xs font-semibold uppercase tracking-wider text-sky-600">Microsoft Store</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Descargas y ventas</h1><p className="mt-2 text-sm text-muted-foreground">Seguimiento simple de clics hacia la descarga y pagos detectados desde ahora.</p></header>
    {clickError ? <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm"><b>No se pudieron cargar los clics.</b> {clickError.message}</div> : null}
    {saleError ? <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm"><b>Falta habilitar el registro de ventas.</b> Aplicá la migración <code>20261005120000_microsoft_store_sales.sql</code>.</div> : null}

    <section className="rounded-2xl border border-sky-500/25 bg-sky-500/5 p-5 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[
        [MousePointerClick, "Clics hoy", daily.get(today) ?? 0], [CalendarDays, "Clics esta semana", clicksThisWeek], [MousePointerClick, "Clics este mes", clicksThisMonth], [Monitor, "Desde PC", clicks.filter((click) => click.device === "desktop").length], [ShoppingCart, "Ventas este mes", quantityThisMonth],
      ].map(([Icon, label, value]) => { const MetricIcon = Icon as typeof MousePointerClick; return <div key={String(label)} className="rounded-xl border border-sky-500/20 bg-background p-4"><MetricIcon className="size-5 text-sky-600" /><p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{String(label)}</p><p className="mt-1 text-3xl font-bold">{String(value)}</p></div>; })}</div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border bg-background p-4"><h2 className="font-semibold">Últimos días con clics</h2><div className="mt-3 divide-y">{recentDays.map(([day, count]) => <div key={day} className="flex justify-between py-2.5 text-sm"><span className="capitalize">{dayLabel(day)}</span><b>{count}</b></div>)}</div>{recentDays.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Todavía no hay clics registrados.</p> : null}</div>
        <div className="rounded-xl border bg-background p-4"><h2 className="font-semibold">Origen de los clics</h2><div className="mt-3 divide-y">{[...byLocation].sort(([, a], [, b]) => b - a).map(([location, count]) => <div key={location} className="flex justify-between py-2.5 text-sm"><span>{storeLocationLabels[location] ?? location}</span><b>{count}</b></div>)}</div></div>
      </div>
    </section>

    <DownloadChart daily={points(daily, 30, (key) => `${key.slice(8)}/${key.slice(5, 7)}`)} weekly={points(weekly, 12, (key) => `${key.slice(8)}/${key.slice(5, 7)}`)} monthly={points(monthly, 12, (key) => `${key.slice(5)}/${key.slice(2, 4)}`)} />

    <ProvinceChart data={provinceData} unknownCount={unknownProvinceClicks} />

    <section className="space-y-4 rounded-2xl border border-emerald-500/25 bg-[var(--pos-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Conversión manual</p><h2 className="mt-1 text-xl font-bold">Marcar ventas pagadas</h2><p className="mt-1 text-sm text-muted-foreground">Cargá cuántas ventas detectaste y el precio cobrado por cada una.</p></div><div className="rounded-xl bg-emerald-500/10 px-4 py-2 text-right"><p className="text-xs font-semibold text-emerald-700">Esta semana · {quantityThisWeek} ventas</p><p className="text-2xl font-black text-emerald-700">{money(revenueThisWeek)}</p></div></div>
      {!saleError ? <><QuickStoreSaleForm today={today} /><details className="rounded-xl border p-4"><summary className="cursor-pointer text-sm font-semibold">Registrar otro importe o varias ventas</summary><div className="mt-4"><StoreSaleForm today={today} /></div></details></> : null}
    </section>

    <PaymentsChart days={paymentDays} total={revenueThisWeek} />

    <section className="rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface)] p-5"><div className="flex items-center gap-2"><CircleDollarSign className="size-5 text-emerald-600" /><h2 className="text-lg font-semibold">Ventas registradas</h2></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b text-xs uppercase tracking-wide text-muted-foreground"><th className="px-3 py-2">Fecha</th><th className="px-3 py-2 text-right">Ventas</th><th className="px-3 py-2 text-right">Precio c/u</th><th className="px-3 py-2 text-right">Total</th><th className="px-3 py-2">Nota</th><th className="w-12" /></tr></thead><tbody>{sales.map((sale) => <tr key={sale.id} className="border-b"><td className="px-3 py-2.5 capitalize">{dayLabel(sale.sale_date)}</td><td className="px-3 py-2.5 text-right font-bold">{sale.quantity}</td><td className="px-3 py-2.5 text-right">{money(Number(sale.total_amount))}</td><td className="px-3 py-2.5 text-right font-bold text-emerald-700">{money(sale.quantity * Number(sale.total_amount))}</td><td className="px-3 py-2.5 text-muted-foreground">{sale.note || "—"}</td><td><DeleteStoreSaleButton id={sale.id} /></td></tr>)}</tbody></table>{sales.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Todavía no registraste ventas.</p> : null}</div></section>
  </div>;
}
