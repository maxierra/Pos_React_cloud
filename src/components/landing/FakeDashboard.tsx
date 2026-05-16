"use client";

import { motion } from "framer-motion";
import { BarChart3, Banknote, CreditCard, Landmark, Receipt, ShoppingCart, TrendingUp, Wallet } from "lucide-react";

import type { DemoChrome } from "@/components/landing/demo-chrome";
import type { DemoSale } from "@/components/landing/demo-types";
import { cn } from "@/lib/utils";

type Props = {
  sales: DemoSale[];
  chrome: DemoChrome;
};

function moneyAr(value: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
}

export function FakeDashboard({ sales, chrome }: Props) {
  const tickets = sales.length;
  const revenue = sales.reduce((acc, s) => acc + s.total, 0);
  const avg = tickets ? revenue / tickets : 0;
  const byMethod = sales.reduce(
    (acc, s) => {
      acc[s.paymentMethod] += s.total;
      return acc;
    },
    { cash: 0, card: 0, transfer: 0 }
  );
  const trend = [0.45, 0.52, 0.48, 0.68, 0.55, 0.72, 0.84];

  return (
    <div className={cn("rounded-xl border p-3 sm:rounded-2xl sm:p-4", chrome.dashboardShell)}>
      <div className="mb-2 flex items-center justify-between sm:mb-3">
        <div className="inline-flex items-center gap-2 text-xs font-semibold sm:text-sm">
          <BarChart3 className={cn("size-4", chrome.accent)} />
          <span className={chrome.h3}>Dashboard en vivo</span>
        </div>
        <div className={cn("text-xs", chrome.muted)}>Auto-refresh</div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
        <Kpi chrome={chrome} icon={TrendingUp} label="Ventas de hoy" value={moneyAr(revenue)} tone="emerald" />
        <Kpi chrome={chrome} icon={Receipt} label="Tickets" value={String(tickets)} tone="default" />
        <Kpi chrome={chrome} icon={ShoppingCart} label="Ticket promedio" value={moneyAr(avg)} tone="default" />
        <Kpi chrome={chrome} icon={BarChart3} label="Anulaciones hoy" value="0" tone="rose" />
        <Kpi chrome={chrome} icon={Wallet} label="Caja actual" value={moneyAr(byMethod.cash)} tone="amber" />
      </div>

      <div className="mt-3 grid gap-3 sm:mt-4 xl:grid-cols-3">
        <div className={cn("xl:col-span-2 rounded-xl border p-3 sm:p-4", chrome.chartCard)}>
          <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className={cn("text-xs font-medium sm:text-sm", chrome.h3)}>Ventas últimos 7 días</div>
            <div className={cn("text-[10px] sm:text-xs", chrome.muted)}>Tendencia diaria</div>
          </div>
          <div className="overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
          <div className="grid min-w-[260px] grid-cols-7 items-end gap-1.5 sm:min-w-0 sm:gap-2">
            {trend.map((n, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={cn("w-full rounded-md px-1", chrome.chartTrack)}>
                  <motion.div
                    className={cn("mx-auto w-full rounded-sm", chrome.chartBar)}
                    animate={{ height: `${Math.max(8, Math.round(n * 90))}px` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className={cn("text-[10px]", chrome.muted)}>D{i + 1}</div>
              </div>
            ))}
          </div>
          </div>
        </div>

        <div className={cn("rounded-xl border p-3 sm:p-4", chrome.chartCard)}>
          <div className={cn("mb-2 text-xs font-medium sm:text-sm", chrome.h3)}>Métodos de pago hoy</div>
          <div className="grid gap-2 text-sm">
            <MethodRow chrome={chrome} icon={Banknote} label="Efectivo" value={moneyAr(byMethod.cash)} tone="emerald" />
            <MethodRow chrome={chrome} icon={CreditCard} label="Tarjeta" value={moneyAr(byMethod.card)} tone="amber" />
            <MethodRow
              chrome={chrome}
              icon={Landmark}
              label="Transferencia"
              value={moneyAr(byMethod.transfer)}
              tone="violet"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
  icon: Icon,
  chrome,
}: {
  label: string;
  value: string;
  tone: "default" | "emerald" | "amber" | "rose";
  icon: React.ComponentType<{ className?: string }>;
  chrome: DemoChrome;
}) {
  const toneClass =
    tone === "default"
      ? chrome.kpiDefault
      : tone === "emerald"
        ? chrome.kpiEmerald
        : tone === "amber"
          ? chrome.kpiAmber
          : chrome.kpiRose;

  return (
    <div className={cn("rounded-lg border p-2 sm:rounded-xl sm:p-2.5", toneClass)}>
      <div className="inline-flex items-center gap-0.5 text-[10px] opacity-90 sm:gap-1 sm:text-[11px]">
        <Icon className="size-3 shrink-0 sm:size-3.5" />
        <span className="line-clamp-2 leading-tight">{label}</span>
      </div>
      <div className="mt-0.5 truncate text-sm font-semibold sm:mt-1 sm:text-base">{value}</div>
    </div>
  );
}

function MethodRow({
  icon: Icon,
  label,
  value,
  tone,
  chrome,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "emerald" | "amber" | "violet";
  chrome: DemoChrome;
}) {
  const tones = {
    emerald: chrome.methodEmerald,
    amber: chrome.methodAmber,
    violet: chrome.methodViolet,
  } as const;

  return (
    <div className={cn("flex items-center justify-between rounded-lg px-3 py-2", tones[tone])}>
      <span className="inline-flex items-center gap-1.5">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
