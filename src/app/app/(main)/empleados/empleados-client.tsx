"use client";

import * as React from "react";
import {
  Ban,
  Banknote,
  CircleDot,
  FileSpreadsheet,
  LogIn,
  LogOut,
  Package,
  PackagePlus,
  Trash2,
  User,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { exportStyledWorkbook } from "@/lib/excel-utils";
import { cn } from "@/lib/utils";

export type ActivityEventRow = {
  id: string;
  user_id: string | null;
  kind: string;
  summary: string;
  metadata: Record<string, unknown> | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
};

export type MemberEmailRow = {
  user_id: string;
  email: string;
};

const KIND_LABEL: Record<string, string> = {
  session_start: "Inicio sesión",
  session_end: "Cierre sesión",
  sale: "Venta",
  sale_void: "Anulación",
  product_create: "Alta producto",
  product_update: "Cambio producto",
  product_delete: "Baja producto",
};

type KindUi = {
  Icon: LucideIcon;
  /** Clases del chip de tipo */
  pill: string;
  /** Borde izquierdo de la fila */
  rowBorder: string;
};

const KIND_UI: Record<string, KindUi> = {
  session_start: {
    Icon: LogIn,
    pill: "border-sky-500/35 bg-sky-500/12 text-sky-900 dark:border-sky-400/40 dark:bg-sky-500/15 dark:text-sky-100",
    rowBorder: "border-l-sky-500",
  },
  session_end: {
    Icon: LogOut,
    pill: "border-slate-400/40 bg-slate-500/10 text-slate-800 dark:border-slate-500/50 dark:bg-slate-500/15 dark:text-slate-100",
    rowBorder: "border-l-slate-500",
  },
  sale: {
    Icon: Banknote,
    pill: "border-emerald-500/40 bg-emerald-500/12 text-emerald-950 dark:border-emerald-400/45 dark:bg-emerald-500/15 dark:text-emerald-50",
    rowBorder: "border-l-emerald-500",
  },
  sale_void: {
    Icon: Ban,
    pill: "border-rose-500/45 bg-rose-500/12 text-rose-950 dark:border-rose-400/50 dark:bg-rose-500/18 dark:text-rose-50",
    rowBorder: "border-l-rose-500",
  },
  product_create: {
    Icon: PackagePlus,
    pill: "border-violet-500/40 bg-violet-500/12 text-violet-950 dark:border-violet-400/45 dark:bg-violet-500/15 dark:text-violet-50",
    rowBorder: "border-l-violet-500",
  },
  product_update: {
    Icon: Package,
    pill: "border-amber-500/45 bg-amber-500/12 text-amber-950 dark:border-amber-400/50 dark:bg-amber-500/15 dark:text-amber-50",
    rowBorder: "border-l-amber-500",
  },
  product_delete: {
    Icon: Trash2,
    pill: "border-red-500/45 bg-red-500/10 text-red-950 dark:border-red-400/50 dark:bg-red-500/18 dark:text-red-50",
    rowBorder: "border-l-red-600",
  },
};

const KIND_FALLBACK: KindUi = {
  Icon: CircleDot,
  pill: "border-[var(--pos-border)] bg-[var(--pos-surface-2)] text-muted-foreground",
  rowBorder: "border-l-muted-foreground/40",
};

function getKindUi(kind: string): KindUi {
  return KIND_UI[kind] ?? KIND_FALLBACK;
}

function formatWhenParts(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return { date: iso, time: "" };
    return {
      date: d.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: d.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  } catch {
    return { date: iso, time: "" };
  }
}

function formatDayHeading(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function parseYmdLocal(s: string) {
  const [y, m, d] = s.split("-").map((n) => Number(n));
  if (!y || !m || !d) return new Date(NaN);
  return new Date(y, m - 1, d);
}

function dayStartLocal(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayEndLocal(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setHours(23, 59, 59, 999);
  return x;
}

function toDateInputValue(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function localDayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function normEmail(s: string | null | undefined) {
  return (s ?? "").trim().toLowerCase();
}

function metaEmails(row: ActivityEventRow): string[] {
  const meta = row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : {};
  const out: string[] = [];
  const c = meta.cashier_email;
  const a = meta.actor_email;
  if (typeof c === "string" && c) out.push(normEmail(c));
  if (typeof a === "string" && a) out.push(normEmail(a));
  return out;
}

/** Evento atribuido al empleado elegido (uid o email en metadata, p. ej. ventas) */
function rowEmployeeLabel(row: ActivityEventRow, emailByUserId: Map<string, string>): string {
  const email = row.user_id ? emailByUserId.get(row.user_id) : null;
  const meta = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
  const fallback =
    (typeof meta.cashier_email === "string" && meta.cashier_email) ||
    (typeof meta.actor_email === "string" && meta.actor_email) ||
    null;
  return email || fallback || (row.user_id ? `${row.user_id.slice(0, 8)}…` : "—");
}

function buildActivityDetailExportRows(
  rows: ActivityEventRow[],
  emailByUserId: Map<string, string>
): Record<string, unknown>[] {
  return rows.map((row) => ({
    "Fecha y hora": new Date(row.created_at),
    Empleado: rowEmployeeLabel(row, emailByUserId),
    Tipo: KIND_LABEL[row.kind] ?? row.kind,
    Detalle: row.summary,
  }));
}

type ByDayBlock = {
  dayKey: string;
  rows: ActivityEventRow[];
  counts: Record<string, number>;
  firstIso: string;
};

function buildActivitySummaryExportRows(byDay: ByDayBlock[]): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const { counts, firstIso } of byDay) {
    const entries = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
    for (const [kind, n] of entries) {
      out.push({
        Día: formatDayHeading(firstIso),
        Tipo: KIND_LABEL[kind] ?? kind,
        Cantidad: n,
      });
    }
  }
  return out;
}

function safeFilenamePart(s: string) {
  return s
    .trim()
    .replace(/@/g, "_at_")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 48);
}

function eventMatchesUserFilter(
  row: ActivityEventRow,
  userId: string | undefined,
  selectedEmailNorm: string | null
): boolean {
  if (!userId && !selectedEmailNorm) return true;
  if (userId && row.user_id && row.user_id === userId) return true;
  if (selectedEmailNorm) {
    for (const e of metaEmails(row)) {
      if (e === selectedEmailNorm) return true;
    }
  }
  return false;
}

type Props = {
  events: ActivityEventRow[];
  memberEmails: MemberEmailRow[];
  loadError?: string | null;
};

export function EmpleadosClient({ events, memberEmails, loadError }: Props) {
  const emailByUserId = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const r of memberEmails) {
      if (r.user_id && r.email) m.set(r.user_id, r.email);
    }
    return m;
  }, [memberEmails]);

  const [fromStr, setFromStr] = React.useState(() => {
    const t = new Date();
    t.setDate(t.getDate() - 7);
    return toDateInputValue(t);
  });
  const [toStr, setToStr] = React.useState(() => toDateInputValue(new Date()));
  const [userFilter, setUserFilter] = React.useState<string>("");

  const selectedEmailNorm = React.useMemo(() => {
    if (!userFilter) return null;
    const row = memberEmails.find((m) => m.user_id === userFilter);
    return normEmail(row?.email ?? null) || null;
  }, [userFilter, memberEmails]);

  const filtered = React.useMemo(() => {
    const from = dayStartLocal(parseYmdLocal(fromStr));
    const to = dayEndLocal(parseYmdLocal(toStr));
    if (from > to) return [];

    return events.filter((e) => {
      const ts = new Date(e.created_at).getTime();
      if (ts < from.getTime() || ts > to.getTime()) return false;
      if (userFilter) {
        return eventMatchesUserFilter(e, userFilter, selectedEmailNorm);
      }
      return true;
    });
  }, [events, fromStr, toStr, userFilter, selectedEmailNorm]);

  const byDay = React.useMemo(() => {
    const map = new Map<string, ActivityEventRow[]>();
    for (const row of filtered) {
      const k = localDayKey(row.created_at);
      const arr = map.get(k) ?? [];
      arr.push(row);
      map.set(k, arr);
    }
    const keys = [...map.keys()].sort((a, b) => b.localeCompare(a));
    return keys.map((k) => {
      const rows = map.get(k) ?? [];
      const counts: Record<string, number> = {};
      for (const r of rows) {
        counts[r.kind] = (counts[r.kind] ?? 0) + 1;
      }
      return { dayKey: k, rows, counts, firstIso: rows[0]?.created_at ?? "" };
    });
  }, [filtered]);

  const dateRangeLabel = React.useMemo(() => {
    const from = dayStartLocal(parseYmdLocal(fromStr));
    const to = dayEndLocal(parseYmdLocal(toStr));
    if (from > to) return "";
    return `${from.toLocaleDateString("es-AR")} — ${to.toLocaleDateString("es-AR")}`;
  }, [fromStr, toStr]);

  const exportFilenameBase = React.useMemo(() => {
    const who = userFilter
      ? memberEmails.find((m) => m.user_id === userFilter)?.email || userFilter.slice(0, 8)
      : "todos";
    return `actividad_empleados_${fromStr}_${toStr}_${safeFilenamePart(who)}`;
  }, [fromStr, toStr, userFilter, memberEmails]);

  const handleExportExcel = React.useCallback(() => {
    if (filtered.length === 0) return;
    const detail = buildActivityDetailExportRows(filtered, emailByUserId);
    const summary = buildActivitySummaryExportRows(byDay);
    exportStyledWorkbook(
      [
        { name: "Movimientos", data: detail },
        ...(summary.length ? [{ name: "Resumen por día", data: summary } as const] : []),
      ],
      exportFilenameBase
    );
  }, [filtered, emailByUserId, byDay, exportFilenameBase]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Empleados</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registro de actividad: sesiones, ventas, anulaciones y cambios en productos (precio, stock manual, etc.).
        </p>
      </div>

      {loadError ? (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-destructive">No se pudo cargar el registro</CardTitle>
            <CardDescription className="text-destructive/90">
              {loadError}. Si la tabla aún no existe, aplicá las migraciones en Supabase (`supabase db push` o SQL
              editor).
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!loadError && events.length === 0 ? (
        <Card className="mb-6 border-amber-500/40 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sin registros todavía</CardTitle>
            <CardDescription>
              No hay eventos en los últimos 90 días. Suele pasar si la migración de auditoría no se aplicó en tu
              proyecto Supabase, o si todavía no hubo ventas/actividad desde que se activó. Aplicá la migración{" "}
              <code className="rounded bg-muted px-1">20260331120000_business_activity_log.sql</code> y volvé a
              probar una venta.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card className="mb-6 border-[var(--pos-border)] bg-[var(--pos-surface-2)]/60">
        <CardContent className="pt-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Cómo se asignan las ventas</p>
          <p className="mt-1">
            Cada venta queda a nombre del usuario que tenía la sesión iniciada al momento de cobrar en el POS (no
            por el nombre que elijas en otro lado). Para ver las ventas de santi@gmail.com, ese usuario tiene que
            iniciar sesión y cobrar con su cuenta. Si filtrás por un empleado y ves vacío pero en &quot;Todos&quot;
            sí hay ventas, es que esas ventas las hizo otra cuenta.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription>
            Registros cargados: {events.length} (últimos 90 días, máx. 2000). {dateRangeLabel ? `Rango: ${dateRangeLabel}.` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-2">
            <Label htmlFor="emp-from">Desde</Label>
            <Input id="emp-from" type="date" value={fromStr} onChange={(e) => setFromStr(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="emp-to">Hasta</Label>
            <Input id="emp-to" type="date" value={toStr} onChange={(e) => setToStr(e.target.value)} />
          </div>
          <div className="grid gap-2 sm:col-span-2 lg:col-span-2">
            <Label htmlFor="emp-user">Empleado</Label>
            <select
              id="emp-user"
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {memberEmails.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.email || m.user_id.slice(0, 8) + "…"}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-[var(--pos-border)]"
              disabled={filtered.length === 0 || Boolean(loadError)}
              onClick={handleExportExcel}
            >
              <FileSpreadsheet className="size-4 shrink-0" aria-hidden />
              Exportar Excel
            </Button>
            <span className="ml-3 text-xs text-muted-foreground">
              Incluye movimientos del rango y filtros actuales; segunda hoja: resumen por día.
            </span>
          </div>
        </CardContent>
      </Card>

      {filtered.length > 0 && byDay.length > 0 ? (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resumen por día</CardTitle>
            <CardDescription>Totales por tipo en el rango y filtros actuales.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {byDay.map(({ dayKey, counts, firstIso }) => (
              <div
                key={dayKey}
                className="rounded-xl border border-[var(--pos-border)] bg-[var(--pos-surface)] px-4 py-3 text-sm"
              >
                <div className="font-medium capitalize">{formatDayHeading(firstIso)}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {Object.entries(counts)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([kind, n]) => {
                      const ui = getKindUi(kind);
                      const Icon = ui.Icon;
                      return (
                        <span
                          key={kind}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-medium",
                            ui.pill
                          )}
                        >
                          <Icon className="size-3.5 shrink-0 opacity-90" aria-hidden />
                          {KIND_LABEL[kind] ?? kind}: {n}
                        </span>
                      );
                    })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Detalle ({filtered.length})</CardTitle>
          <CardDescription>
            Orden cronológico (más reciente primero). Los movimientos de stock automáticos por venta no se listan
            aparte: quedan en el evento de venta o anulación.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {filtered.length === 0 ? (
            <div className="space-y-2 px-6 py-10 text-center text-sm text-muted-foreground">
              <p>No hay eventos en este rango o con este filtro.</p>
              {events.length > 0 && userFilter ? (
                <p className="text-amber-700 dark:text-amber-400">
                  Hay {events.length} eventos en total en el período cargado: probá &quot;Todos&quot; en empleado o
                  revisá que las ventas se hayan hecho con la cuenta de ese empleado.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-b-xl border-t border-[var(--pos-border)]">
              <table className="w-full min-w-[760px] table-fixed border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--pos-border)] bg-[var(--pos-surface-2)] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="w-[140px] px-4 py-3.5">Cuándo</th>
                    <th className="w-[200px] px-4 py-3.5">Empleado</th>
                    <th className="w-[200px] px-4 py-3.5">Tipo</th>
                    <th className="px-4 py-3.5">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--pos-border)]/70">
                  {filtered.map((row, idx) => {
                    const who = rowEmployeeLabel(row, emailByUserId);
                    const kindLabel = KIND_LABEL[row.kind] ?? row.kind;
                    const ui = getKindUi(row.kind);
                    const KindIcon = ui.Icon;
                    const { date, time } = formatWhenParts(row.created_at);

                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          "border-l-4 transition-colors hover:bg-[var(--pos-surface-2)]/80",
                          ui.rowBorder,
                          idx % 2 === 1 ? "bg-[var(--pos-surface)]/40" : "bg-[var(--pos-bg)]"
                        )}
                      >
                        <td className="align-top px-4 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-foreground">{date}</span>
                            {time ? <span className="text-xs tabular-nums text-muted-foreground">{time}</span> : null}
                          </div>
                        </td>
                        <td className="align-top px-4 py-3.5">
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--pos-border)] bg-[var(--pos-surface-2)] text-muted-foreground">
                              <User className="size-4" aria-hidden />
                            </span>
                            <span className="min-w-0 break-all text-[13px] leading-snug text-foreground">{who}</span>
                          </div>
                        </td>
                        <td className="align-top px-4 py-3.5">
                          <span
                            className={cn(
                              "inline-flex max-w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold leading-tight",
                              ui.pill
                            )}
                          >
                            <KindIcon className="size-3.5 shrink-0 opacity-90" aria-hidden />
                            <span className="min-w-0">{kindLabel}</span>
                          </span>
                        </td>
                        <td className="align-top px-4 py-3.5">
                          <p className="text-[13px] leading-relaxed text-foreground">{row.summary}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
