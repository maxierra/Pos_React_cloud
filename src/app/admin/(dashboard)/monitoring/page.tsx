"use client";

import { Activity, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MonitoringDashboard } from "@/components/monitoring-dashboard";
import { SystemHealth } from "@/components/system-health";
import { getPerformanceMetrics, getPerformanceTrend, getSlowEndpoints, getRecentErrors } from "@/lib/monitoring";

export const dynamic = "force-dynamic";

export default function MonitoringPage() {
  const handleExportJSON = async () => {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - 60 * 60 * 1000);

      const [metrics, trend, slowEndpoints, errors] = await Promise.all([
        getPerformanceMetrics({ startTime, endTime: now }),
        getPerformanceTrend({ startTime, endTime: now, intervalMinutes: 5 }),
        getSlowEndpoints({ startTime, endTime: now, thresholdMs: 500, limit: 10 }),
        getRecentErrors({ startTime, endTime: now, limit: 50 }),
      ]);

      const exportData = {
        generatedAt: new Date().toISOString(),
        period: { startTime: startTime.toISOString(), endTime: now.toISOString() },
        metrics,
        trend,
        slowEndpoints,
        errors,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `monitoring-report-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="h-6 w-6 text-orange-500" />
              Monitoreo del Sistema
            </h1>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground ml-10">
            Vista en tiempo real del rendimiento, errores y métricas del servidor.
          </p>
        </div>
        <Button variant="outline" onClick={handleExportJSON}>
          <Download className="h-4 w-4 mr-2" />
          Exportar JSON
        </Button>
      </div>

      <SystemHealth />

      <div className="rounded-2xl border dark:border-amber-900/30 bg-card dark:bg-[#120a00]/80 p-6 shadow-sm">
        <MonitoringDashboard />
      </div>
    </div>
  );
}
