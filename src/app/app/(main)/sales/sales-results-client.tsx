"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarClock, ChevronDown, ChevronRight, PackageSearch, ReceiptText, WalletCards } from "lucide-react";

import { SalesRowActions } from "@/app/app/(main)/sales/sales-row-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type SalesDayRow = {
  ymd: string;
  label: string;
  salesCount: number;
  total: number;
  rows: SalesDisplayRow[];
};

export type SalesDisplayRow = {
  key: string;
  id: string;
  created_at: string;
  turnLabel: string;
  matchedLabel: string;
  paymentLabel: string;
  paymentClassName: string;
  statusLabel: string;
  statusClassName: string;
  total: string;
  showActions: boolean;
  saleId: string;
  canVoid: boolean;
  splitSummary?: string | null;
  customerName?: string | null;
};

function moneyAr(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

function SalesChart({ data }: { data: SalesDayRow[] }) {
  const chartData = [...data].reverse().map((day) => ({
    dia: day.label,
    total: Number(day.total.toFixed(2)),
    ventas: day.salesCount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolución del período</CardTitle>
        <CardDescription>Facturación agrupada por día. Tocá un día abajo para ver sus ventas.</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No hay datos para graficar.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
              <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "currentColor" }} className="text-slate-600 dark:text-slate-300" />
              <YAxis tick={{ fontSize: 11, fill: "currentColor" }} className="text-slate-600 dark:text-slate-300" />
              <Tooltip
                cursor={{ fill: "rgba(148,163,184,0.10)" }}
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.96)",
                  border: "1px solid rgba(148, 163, 184, 0.28)",
                  borderRadius: "12px",
                  color: "#f8fafc",
                }}
                formatter={(value, name) =>
                  name === "total"
                    ? [moneyAr(Number(value ?? 0)), "Facturación"]
                    : [String(value ?? 0), "Ventas"]
                }
              />
              <Bar dataKey="total" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function SalesResultsClient({
  days,
  emptyMessage,
}: {
  days: SalesDayRow[];
  emptyMessage: string;
}) {
  const firstDayKey = days[0]?.ymd ?? "";
  const [openDays, setOpenDays] = React.useState<Record<string, boolean>>({});

  if (days.length === 0) {
    return (
      <div className="rounded-2xl border bg-card px-4 py-10 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SalesChart data={days} />

      <div className="space-y-4">
        {days.map((day) => {
          const isOpen = openDays[day.ymd] ?? day.ymd === firstDayKey;
          return (
            <Card key={day.ymd}>
              <button
                type="button"
                onClick={() => setOpenDays((prev) => ({ ...prev, [day.ymd]: !isOpen }))}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                  <div>
                    <div className="font-semibold">{day.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {day.salesCount} venta(s) · {moneyAr(day.total)}
                    </div>
                  </div>
                </div>
              </button>

              {isOpen ? (
                <CardContent className="pt-0">
                  <div className="grid gap-3 md:hidden">
                    {day.rows.map((row) => (
                      <article key={`mobile-${row.key}`} className="rounded-2xl border border-border/70 bg-[var(--pos-surface)] p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                              <ReceiptText className="size-4 text-blue-500" />
                              Venta #{row.id.slice(0, 8)}
                            </div>
                            <div className="mt-2 text-2xl font-black tracking-tight">{row.total}</div>
                          </div>
                          <span className={row.statusClassName}>{row.statusLabel}</span>
                        </div>

                        <div className="mt-4 grid gap-2.5 rounded-2xl bg-[var(--pos-surface-2)] p-3 text-xs">
                          <div className="flex items-start gap-2.5">
                            <CalendarClock className="mt-0.5 size-4 shrink-0 text-sky-500" />
                            <div><span className="text-muted-foreground">Fecha</span><div className="mt-0.5 font-medium">{row.created_at}</div></div>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <WalletCards className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                            <div className="min-w-0">
                              <span className={row.paymentClassName}>{row.paymentLabel}</span>
                              {row.splitSummary ? <div className="mt-1 text-muted-foreground">{row.splitSummary}</div> : null}
                              {row.paymentLabel === "Cuenta corriente" ? <div className="mt-1 text-muted-foreground">Cliente: <span className="font-medium text-foreground">{row.customerName ?? "Sin identificar"}</span></div> : null}
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <PackageSearch className="mt-0.5 size-4 shrink-0 text-violet-500" />
                            <div><span className="text-muted-foreground">Producto</span><div className="mt-0.5 font-medium">{row.matchedLabel}</div></div>
                          </div>
                        </div>

                        {row.showActions ? <div className="mt-3 border-t border-border/60 pt-3"><SalesRowActions saleId={row.saleId} canVoid={row.canVoid} /></div> : null}
                      </article>
                    ))}
                  </div>

                  <div className="hidden overflow-auto rounded-xl border md:block">
                    <table className="w-full min-w-[1120px] text-sm">
                      <thead className="bg-[var(--pos-surface-2)] text-muted-foreground">
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left font-medium">Ticket</th>
                          <th className="px-4 py-3 text-left font-medium">Fecha (AR)</th>
                          <th className="px-4 py-3 text-left font-medium">Turno de caja</th>
                          <th className="px-4 py-3 text-left font-medium">Producto buscado</th>
                          <th className="px-4 py-3 text-left font-medium">Método</th>
                          <th className="px-4 py-3 text-left font-medium">Estado</th>
                          <th className="px-4 py-3 text-right font-medium">Total</th>
                          <th className="px-4 py-3 text-right font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {day.rows.map((row) => (
                          <tr key={row.key} className="border-b last:border-b-0">
                            <td className="px-4 py-3">
                              <div className="font-medium">Venta #{row.id.slice(0, 8)}</div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{row.created_at}</td>
                            <td className="px-4 py-3 text-muted-foreground">{row.turnLabel}</td>
                            <td className="px-4 py-3">
                              <div className="max-w-[280px] text-xs text-muted-foreground">
                                <div className="font-medium text-foreground">{row.matchedLabel}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                <span className={row.paymentClassName}>{row.paymentLabel}</span>
                                {row.splitSummary ? (
                                  <div className="max-w-[280px] text-[11px] leading-snug text-muted-foreground">
                                    {row.splitSummary}
                                  </div>
                                ) : null}
                                {row.paymentLabel === "Cuenta corriente" ? (
                                  <div className="max-w-[220px] text-[11px] leading-snug text-muted-foreground">
                                    Cliente: <span className="font-medium text-foreground">{row.customerName ?? "Sin identificar"}</span>
                                  </div>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={row.statusClassName}>{row.statusLabel}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-numeric font-semibold">{row.total}</td>
                            <td className="px-4 py-3">
                              {row.showActions ? <SalesRowActions saleId={row.saleId} canVoid={row.canVoid} /> : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
