"use client";

import { Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AdminWithMonitoring() {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Plataforma</p>
        <h1 className="text-3xl font-bold tracking-tight">Administración</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Gestión de suscripciones y monitoreo del sistema
        </p>
      </div>
      <Link href="/admin/monitoring">
        <Button variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Monitoreo
        </Button>
      </Link>
    </div>
  );
}