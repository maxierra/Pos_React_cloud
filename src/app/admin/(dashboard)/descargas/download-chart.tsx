"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type DownloadChartPoint = { key: string; label: string; descargas: number };

type Props = {
  daily: DownloadChartPoint[];
  weekly: DownloadChartPoint[];
  monthly: DownloadChartPoint[];
};

const views = {
  daily: { label: "Por día", subtitle: "Últimos 30 días" },
  weekly: { label: "Por semana", subtitle: "Últimas 12 semanas" },
  monthly: { label: "Por mes", subtitle: "Últimos 12 meses" },
} as const;

export function DownloadChart({ daily, weekly, monthly }: Props) {
  const [view, setView] = useState<keyof typeof views>("daily");
  const data = { daily, weekly, monthly }[view];
  const total = useMemo(() => data.reduce((sum, point) => sum + point.descargas, 0), [data]);

  return <section className="rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface)] p-5 shadow-sm">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-lg font-semibold">Evolución de descargas</h2><p className="mt-1 text-sm text-muted-foreground">{views[view].subtitle} · {total} descargas</p></div>
      <div className="flex w-fit rounded-xl bg-[var(--pos-surface-2)] p-1" aria-label="Período del gráfico">{(Object.keys(views) as Array<keyof typeof views>).map((key) => <button key={key} type="button" onClick={() => setView(key)} aria-pressed={view === key} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${view === key ? "bg-orange-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{views[key].label}</button>)}</div>
    </div>
    <div className="mt-6 h-80 w-full" aria-label={`Gráfico de descargas ${views[view].label.toLowerCase()}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip cursor={{ fill: "rgba(249,115,22,.08)" }} formatter={(value) => [Number(value ?? 0), "Descargas"]} labelFormatter={(_, payload) => payload[0]?.payload?.key ?? ""} />
          <Bar dataKey="descargas" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </section>;
}
