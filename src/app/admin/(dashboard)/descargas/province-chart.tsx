"use client";

import { useSyncExternalStore } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type ProvinceChartPoint = { province: string; clicks: number };

export function ProvinceChart({ data, unknownCount }: { data: ProvinceChartPoint[]; unknownCount: number }) {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const chartHeight = Math.max(280, data.length * 42);

  return <section className="rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface)] p-5 shadow-sm">
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">Ubicación aproximada</p>
      <h2 className="mt-1 text-lg font-semibold">Clics por provincia este mes</h2>
      <p className="mt-1 text-sm text-muted-foreground">Se estima por la conexión a internet. Puede diferir de la ubicación real.</p>
    </div>
    {data.length > 0 ? <div className="mt-5 w-full" style={{ height: chartHeight }} aria-label="Gráfico de clics por provincia">
      {mounted ? <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.25} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="province" width={120} tick={{ fontSize: 11 }} />
          <Tooltip cursor={{ fill: "rgba(14,165,233,.08)" }} formatter={(value) => [Number(value ?? 0), "Clics"]} />
          <Bar dataKey="clicks" fill="#0ea5e9" radius={[0, 6, 6, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer> : <div className="h-full w-full rounded-xl bg-muted/20" aria-hidden="true" />}
    </div> : <p className="mt-5 rounded-xl bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">Todavía no hay clics nuevos con ubicación disponible.</p>}
    {unknownCount > 0 ? <p className="mt-4 text-xs text-muted-foreground"><b>{unknownCount}</b> clics del mes no tienen provincia disponible; incluye registros anteriores a esta mejora.</p> : null}
  </section>;
}
