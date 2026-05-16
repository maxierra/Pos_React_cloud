"use client";

import * as React from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { 
  Clock, AlertTriangle, TrendingUp, Activity, RefreshCw 
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPerformanceMetrics, getPerformanceTrend, getSlowEndpoints, getRecentErrors } from "@/lib/monitoring";

type MetricRow = {
  endpoint: string;
  method: string;
  total_requests: number;
  avg_duration_ms: number;
  p50_duration_ms: number;
  p95_duration_ms: number;
  p99_duration_ms: number;
  error_count: number;
  error_rate: number;
};

type TrendRow = {
  time_bucket: string;
  total_requests: number;
  avg_duration_ms: number;
  error_count: number;
};

type SlowEndpoint = {
  endpoint: string;
  method: string;
  call_count: number;
  avg_duration_ms: number;
  p95_duration_ms: number;
  slow_calls: number;
  error_count: number;
};

type ErrorLog = {
  id: string;
  created_at: string;
  endpoint: string;
  method: string;
  duration_ms: number;
  status_code: number;
  error_message: string;
};

function formatMs(ms: number) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatNumber(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-AR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MonitoringDashboard() {
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [timeRange, setTimeRange] = React.useState("1h");
  const [metrics, setMetrics] = React.useState<MetricRow[]>([]);
  const [trend, setTrend] = React.useState<TrendRow[]>([]);
  const [slowEndpoints, setSlowEndpoints] = React.useState<SlowEndpoint[]>([]);
  const [errors, setErrors] = React.useState<ErrorLog[]>([]);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const now = new Date();
      let startTime = new Date(now.getTime() - 60 * 60 * 1000);
      
      switch (timeRange) {
        case "15m": startTime = new Date(now.getTime() - 15 * 60 * 1000); break;
        case "1h": startTime = new Date(now.getTime() - 60 * 60 * 1000); break;
        case "6h": startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000); break;
        case "24h": startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
        case "7d": startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      }

      const [metricsData, trendData, slowData, errorsData] = await Promise.all([
        getPerformanceMetrics({ startTime, endTime: now }),
        getPerformanceTrend({ startTime, endTime: now, intervalMinutes: timeRange === "15m" ? 1 : 5 }),
        getSlowEndpoints({ startTime, endTime: now, thresholdMs: 500, limit: 10 }),
        getRecentErrors({ startTime, endTime: now, limit: 20 }),
      ]);

      setMetrics(metricsData);
      setTrend(trendData);
      setSlowEndpoints(slowData);
      setErrors(errorsData);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : String(err);
      setLoadError(msg);
      console.error("Failed to load monitoring data:", err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const totalRequests = metrics.reduce((acc, m) => acc + Number(m.total_requests), 0);
  const avgDuration = metrics.length > 0 && totalRequests > 0
    ? metrics.reduce((acc, m) => acc + Number(m.avg_duration_ms) * Number(m.total_requests), 0) / totalRequests 
    : 0;
  const totalErrors = metrics.reduce((acc, m) => acc + Number(m.error_count), 0);
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  const p95Overall = metrics.length > 0
    ? metrics.sort((a, b) => Number(b.p95_duration_ms) - Number(a.p95_duration_ms))[0]?.p95_duration_ms ?? 0
    : 0;

  if (loading && metrics.length === 0 && !loadError) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const monitoringHint =
    "Las métricas vienen de server actions registradas en Supabase (tabla performance_logs). En producción definí NEXT_PUBLIC_ENABLE_MONITORING=true. Si fallan las consultas, ejecutá el script supabase/monitoring_schema.sql en el SQL Editor de Supabase.";

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">No se pudieron cargar las métricas</p>
          <p className="mt-1 font-mono text-xs opacity-90">{loadError}</p>
          <p className="mt-2 text-muted-foreground text-xs">{monitoringHint}</p>
        </div>
      )}

      {!loadError && !loading && metrics.length === 0 && trend.length === 0 && (
        <div className="rounded-lg border dark:border-amber-900/30 bg-muted/40 dark:bg-amber-950/20 px-4 py-3 text-sm text-muted-foreground dark:text-amber-200/60">
          <p className="font-medium text-foreground dark:text-amber-100">Sin datos en este período</p>
          <p className="mt-1">
            Usá el POS, productos, caja u otras acciones de la app y volvé a actualizar. {monitoringHint}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight dark:text-amber-50">Monitoreo de Rendimiento</h2>
          <p className="text-sm text-muted-foreground dark:text-amber-200/50">Tiempos de server actions (no incluye solo navegación entre páginas)</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="h-9 rounded-md border border-input dark:border-amber-900/40 bg-background dark:bg-zinc-950 px-3 py-1 text-sm dark:text-amber-100"
          >
            <option value="15m">Últimos 15 min</option>
            <option value="1h">Última hora</option>
            <option value="6h">Últimas 6 horas</option>
            <option value="24h">Últimas 24 horas</option>
            <option value="7d">Últimos 7 días</option>
          </select>
          <Button variant="outline" size="icon" onClick={loadData} className="dark:border-amber-900/40 dark:hover:bg-amber-950/40 dark:text-amber-500">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="dark:bg-amber-950/10 dark:border-amber-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium dark:text-amber-100/90">Requests Totales</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground dark:text-amber-500/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-amber-50">{formatNumber(totalRequests)}</div>
            <p className="text-xs text-muted-foreground dark:text-amber-200/50">en el período seleccionado</p>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-amber-950/10 dark:border-amber-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium dark:text-amber-100/90">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground dark:text-amber-500/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-amber-50">{formatMs(avgDuration)}</div>
            <p className="text-xs text-muted-foreground dark:text-amber-200/50">p50: {formatMs(metrics[0]?.p50_duration_ms ?? 0)}</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-amber-950/10 dark:border-amber-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium dark:text-amber-100/90">P95 Latencia</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground dark:text-amber-500/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-amber-50">{formatMs(p95Overall)}</div>
            <p className="text-xs text-muted-foreground dark:text-amber-200/50">95% de requests más rápidos</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-orange-950/10 dark:border-orange-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium dark:text-amber-100/90">Tasa de Errores</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground dark:text-orange-500/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-amber-50">{errorRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground dark:text-orange-200/50">{totalErrors} errores totales</p>
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-amber-950/10 dark:border-amber-900/30">
        <CardHeader>
          <CardTitle className="dark:text-amber-100/90">Tendencia de Requests</CardTitle>
          <CardDescription className="dark:text-amber-200/50">Requests por minuto y duración promedio</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {trend.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground dark:text-amber-200/50">
              No hay datos disponibles
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-amber-900/20" />
                <XAxis 
                  dataKey="time_bucket" 
                  tickFormatter={(v) => formatDateTime(String(v))}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  className="dark:fill-amber-200/70"
                />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'currentColor' }} className="dark:fill-amber-200/70" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'currentColor' }} className="dark:fill-amber-200/70" />
                <Tooltip 
                  labelFormatter={(v) => formatDateTime(String(v))}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#451a03', color: '#fef3c7' }}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="total_requests" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Requests"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="avg_duration_ms" 
                  stroke="#fb923c" 
                  strokeWidth={2}
                  name="Avg ms"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="dark:bg-amber-950/10 dark:border-amber-900/30">
          <CardHeader>
            <CardTitle className="dark:text-amber-100/90">Endpoints Lentos</CardTitle>
            <CardDescription className="dark:text-amber-200/50">Con promedio {'>'} 500ms</CardDescription>
          </CardHeader>
          <CardContent>
            {slowEndpoints.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground dark:text-amber-200/50 text-sm">
                No hay endpoints lentos
              </div>
            ) : (
              <div className="space-y-2">
                {slowEndpoints.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded border dark:border-amber-900/30 dark:bg-amber-950/20 text-sm">
                    <div className="truncate font-mono text-xs dark:text-amber-100">{s.endpoint}</div>
                    <div className="font-medium dark:text-orange-400">{formatMs(s.avg_duration_ms)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="dark:bg-orange-950/10 dark:border-orange-900/30">
          <CardHeader>
            <CardTitle className="dark:text-amber-100/90">Errores Recientes</CardTitle>
            <CardDescription className="dark:text-amber-200/50">Últimos 20 errores</CardDescription>
          </CardHeader>
          <CardContent>
            {errors.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground dark:text-amber-200/50 text-sm">
                No hay errores
              </div>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {errors.slice(0, 10).map((e) => (
                  <div key={e.id} className="p-2 rounded border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono dark:text-red-300">{e.method}</span>
                      <span className="truncate flex-1 dark:text-red-200/80">{e.endpoint}</span>
                      <span className="text-red-500 font-medium">{e.status_code}</span>
                    </div>
                    <div className="text-red-600 dark:text-red-400 mt-1 truncate">{e.error_message}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-amber-950/10 dark:border-amber-900/30">
        <CardHeader>
          <CardTitle className="dark:text-amber-100/90">Métricas por Endpoint</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-amber-900/30">
                  <th className="text-left py-2 px-2 dark:text-amber-200/70">Endpoint</th>
                  <th className="text-right py-2 px-2 dark:text-amber-200/70">Método</th>
                  <th className="text-right py-2 px-2 dark:text-amber-200/70">Reqs</th>
                  <th className="text-right py-2 px-2 dark:text-amber-200/70">Avg</th>
                  <th className="text-right py-2 px-2 dark:text-amber-200/70">P95</th>
                  <th className="text-right py-2 px-2 dark:text-amber-200/70">Errores</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m, i) => (
                  <tr key={i} className="border-b dark:border-amber-900/10 hover:bg-muted/50 dark:hover:bg-amber-950/30 transition-colors">
                    <td className="py-2 px-2 font-mono text-xs truncate max-w-[200px] dark:text-amber-100">{m.endpoint}</td>
                    <td className="py-2 px-2 text-right text-xs dark:text-amber-200/70">{m.method}</td>
                    <td className="py-2 px-2 text-right dark:text-amber-200/90">{m.total_requests}</td>
                    <td className="py-2 px-2 text-right font-medium dark:text-amber-400">{formatMs(m.avg_duration_ms)}</td>
                    <td className="py-2 px-2 text-right dark:text-amber-200/70">{formatMs(m.p95_duration_ms)}</td>
                    <td className="py-2 px-2 text-right">
                      {Number(m.error_count) > 0 ? (
                        <span className="text-red-500 dark:text-red-400 font-bold">{m.error_count}</span>
                      ) : (
                        <span className="text-muted-foreground dark:text-amber-500/30">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}