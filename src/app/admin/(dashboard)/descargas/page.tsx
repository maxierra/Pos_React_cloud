import { Download, KeyRound, Phone, Users } from "lucide-react";

import { updateDownloadFollowup, updateDownloadLead } from "@/app/admin/(dashboard)/descargas/actions";
import { ClearAllDownloadLeadsButton, DeleteDownloadLeadButton } from "@/app/admin/(dashboard)/descargas/delete-controls";
import { DownloadChart, type DownloadChartPoint } from "@/app/admin/(dashboard)/descargas/download-chart";
import { DownloadsPaymentsPie, PaymentsChart, type PaymentDay } from "@/app/admin/(dashboard)/descargas/payments-chart";
import { FollowupControls } from "@/app/admin/(dashboard)/descargas/followup-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DESKTOP_DOWNLOAD_ASSET_KEY } from "@/lib/desktop-download";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type DownloadLead = {
  id: string;
  full_name: string | null;
  phone: string | null;
  source: string;
  created_at: string;
  activation_requested: boolean;
  activation_requested_at: string | null;
  admin_note: string | null;
  contacted_at: string | null;
  activation_paid_at: string | null;
  reminder_sent_at: string | null;
  activation_code: string | null;
};

function dayKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function dayLabel(value: string) {
  return new Date(`${value}T12:00:00-03:00`).toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

function weekKey(value: string) {
  const date = new Date(`${dayKey(value)}T12:00:00Z`);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

function monthKey(value: string) {
  return dayKey(value).slice(0, 7);
}

function weekLabel(value: string) {
  return new Date(`${value}T12:00:00-03:00`).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

function dateLabel(value: string) {
  return new Date(`${value}T12:00:00-03:00`).toLocaleDateString("es-AR", { weekday: "short", day: "2-digit" });
}

function chartPoints(map: Map<string, number>, limit: number, format: (key: string) => string): DownloadChartPoint[] {
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-limit).map(([key, descargas]) => ({ key, label: format(key), descargas }));
}

export default async function AdminDownloadsPage() {
  const { data, error } = await createAdminClient().from("download_events")
    .select("id,full_name,phone,source,created_at,activation_requested,activation_requested_at,admin_note,contacted_at,activation_paid_at,reminder_sent_at,activation_code")
    .eq("asset_key", DESKTOP_DOWNLOAD_ASSET_KEY)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) return <div className="mx-auto max-w-7xl p-6"><div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5"><h1 className="text-xl font-bold">No se pudieron cargar las descargas</h1><p className="mt-2 text-sm text-muted-foreground">{error.message}. Aplicá la migración 20260902130000_download_leads.sql.</p></div></div>;

  const leads = (data ?? []) as DownloadLead[];
  const daily = new Map<string, number>();
  const weekly = new Map<string, number>();
  const monthly = new Map<string, number>();
  const paidWeekly = new Map<string, number>();
  for (const lead of leads) {
    const day = dayKey(lead.created_at);
    const week = weekKey(lead.created_at);
    const month = monthKey(lead.created_at);
    daily.set(day, (daily.get(day) ?? 0) + 1);
    weekly.set(week, (weekly.get(week) ?? 0) + 1);
    monthly.set(month, (monthly.get(month) ?? 0) + 1);
    if (lead.activation_paid_at) {
      const paidWeek = weekKey(lead.activation_paid_at);
      paidWeekly.set(paidWeek, (paidWeekly.get(paidWeek) ?? 0) + 1);
    }
  }
  const dailyRows = [...daily.entries()].slice(0, 31);
  const today = dayKey(new Date().toISOString());
  const thisWeek = weekKey(new Date().toISOString());
  const thisMonth = monthKey(new Date().toISOString());
  const activationCount = leads.filter((lead) => lead.activation_requested).length;
  const paidThisWeek = paidWeekly.get(thisWeek) ?? 0;
  const weekStart = new Date(`${thisWeek}T12:00:00-03:00`);
  const paymentDays: PaymentDay[] = Array.from({ length: 7 }, (_, index) => { const date = new Date(weekStart); date.setDate(date.getDate() + index); const day = dayKey(date.toISOString()); const payments = leads.filter((lead) => lead.activation_paid_at && dayKey(lead.activation_paid_at) === day); return { day, label: dateLabel(day), payments: payments.length, amount: payments.length * 35000 }; });
  const paidCustomers = leads.filter((lead) => lead.activation_paid_at && dayKey(lead.activation_paid_at) >= thisWeek).map((lead) => ({ name: lead.full_name || "Cliente sin nombre", date: new Date(lead.activation_paid_at!).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) }));
  const chartDaily = chartPoints(daily, 30, (key) => `${key.slice(8, 10)}/${key.slice(5, 7)}`);
  const chartWeekly = chartPoints(weekly, 12, (key) => `${key.slice(8, 10)}/${key.slice(5, 7)}`);
  const chartMonthly = chartPoints(monthly, 12, (key) => `${key.slice(5, 7)}/${key.slice(2, 4)}`);

  return <div className="mx-auto w-full max-w-7xl space-y-7 px-4 py-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-orange-500">Seguimiento comercial</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Descargas y activaciones</h1><p className="mt-2 text-sm text-muted-foreground">Registro diario de personas que descargaron la prueba y solicitaron su clave.</p></div><ClearAllDownloadLeadsButton count={leads.length} /></div>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {[[Download, "Descargas hoy", daily.get(today) ?? 0], [Users, "Esta semana", weekly.get(thisWeek) ?? 0], [Phone, "Este mes", monthly.get(thisMonth) ?? 0], [KeyRound, "Pidieron activación", activationCount], [Download, "Total registrado", leads.length]].map(([Icon, label, value]) => { const MetricIcon = Icon as typeof Download; return <div key={String(label)} className="rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface)] p-4"><MetricIcon className="size-5 text-orange-500" /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{String(label)}</p><p className="mt-1 text-3xl font-bold">{String(value)}</p></div>; })}
    </div>

    <DownloadChart daily={chartDaily} weekly={chartWeekly} monthly={chartMonthly} />
    <PaymentsChart days={paymentDays} total={paidThisWeek * 35000} customers={paidCustomers} />
    <DownloadsPaymentsPie downloads={leads.length} payments={leads.filter((lead) => Boolean(lead.activation_paid_at)).length} />
    <section className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5"><h2 className="text-lg font-semibold">Pagos confirmados por semana</h2><p className="mt-1 text-sm text-muted-foreground">Clientes que marcaron pago de licencia.</p><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><thead><tr className="border-b text-xs uppercase tracking-wide text-muted-foreground"><th className="px-3 py-2">Semana desde</th><th className="px-3 py-2 text-right">Pagos</th><th className="px-3 py-2 text-right">Total</th></tr></thead><tbody>{[...paidWeekly.entries()].sort(([a], [b]) => b.localeCompare(a)).slice(0, 12).map(([week, count]) => <tr key={week} className="border-b border-emerald-500/10"><td className="px-3 py-2.5 font-medium capitalize">{weekLabel(week)}</td><td className="px-3 py-2.5 text-right font-bold">{count}</td><td className="px-3 py-2.5 text-right font-bold text-emerald-700">${(count * 35000).toLocaleString("es-AR")}</td></tr>)}</tbody></table>{paidWeekly.size === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Todavía no hay pagos confirmados.</p> : null}</div></section>

    <section className="rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface)] p-5"><h2 className="text-lg font-semibold">Descargas por día</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><thead><tr className="border-b text-xs uppercase tracking-wide text-muted-foreground"><th className="px-3 py-2">Día</th><th className="px-3 py-2 text-right">Descargas</th></tr></thead><tbody>{dailyRows.map(([day, count]) => <tr key={day} className="border-b border-[var(--pos-border)]/70"><td className="px-3 py-2.5 font-medium capitalize">{dayLabel(day)}</td><td className="px-3 py-2.5 text-right font-bold">{count}</td></tr>)}</tbody></table>{dailyRows.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Todavía no hay descargas registradas.</p> : null}</div></section>

    <section className="rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface)] p-5"><h2 className="text-lg font-semibold">Personas que descargaron</h2><p className="mt-1 text-sm text-muted-foreground">Saludá, ayudá, recordá el vencimiento y registrá el pago de la licencia de $35.000.</p><div className="mt-4 space-y-3">{leads.map((lead) => <div key={lead.id} className="grid gap-3 rounded-xl border border-[var(--pos-border)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{lead.full_name || "Descarga anterior sin nombre"}</p><p className="mt-0.5 text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short" })} · {lead.phone || "Sin teléfono"} · {lead.source}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${lead.activation_requested ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-muted text-muted-foreground"}`}>{lead.activation_requested ? "Pidió activación" : "Sin pedido"}</span></div><FollowupControls id={lead.id} name={lead.full_name || "Hola"} phone={lead.phone} createdAt={lead.created_at} contactedAt={lead.contacted_at} paidAt={lead.activation_paid_at} reminderAt={lead.reminder_sent_at} /><form action={updateDownloadLead} className="flex flex-wrap items-center gap-2"><input type="hidden" name="id" value={lead.id} /><Input name="adminNote" defaultValue={lead.admin_note ?? ""} maxLength={500} placeholder="Nota interna…" aria-label={`Nota sobre ${lead.full_name ?? "esta descarga"}`} className="h-9 max-w-md" /><Button type="submit" name="activationState" value={lead.activation_requested ? "not_requested" : "requested"} variant="outline">{lead.activation_requested ? "Quitar marca de activación" : "Marcar pedido de activación"}</Button><Button type="submit" name="activationState" value={lead.activation_requested ? "requested" : "not_requested"} variant="outline">Guardar nota</Button><DeleteDownloadLeadButton id={lead.id} name={lead.full_name || "esta descarga"} /></form></div>)}</div>{leads.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Todavía no hay contactos.</p> : null}</section>
  </div>;
}
