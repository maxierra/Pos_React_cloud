"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type Props = {
  name: string;
  price: number;
  stockLabel: string;
  stockState: "ok" | "low" | "out";
  disabled?: boolean;
  onClick: () => void;
  highlight?: boolean;
};

const stockClass: Record<Props["stockState"], string> = {
  ok: "text-emerald-300",
  low: "text-[var(--pos-amber)]",
  out: "text-destructive",
};

export function ProductCard({ name, price, stockLabel, stockState, disabled, onClick, highlight }: Props) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      animate={highlight ? { scale: [1, 1.02, 1] } : { scale: 1 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "group relative flex w-full flex-col justify-between gap-2 rounded-2xl border p-4 text-left",
        "border-[var(--pos-border)] bg-[var(--pos-surface)]",
        "transition-shadow hover:shadow-[0_0_0_1px_var(--pos-glow)]",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--pos-glow)]",
        disabled ? "opacity-50" : "hover:border-[var(--pos-accent)]",
        highlight ? "shadow-pos-glow" : ""
      )}
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold tracking-tight">{name}</div>
        <div className={cn("mt-1 text-xs", stockClass[stockState])}>{stockLabel}</div>
      </div>

      <div className="flex items-end justify-between">
        <div className="font-numeric text-xl font-semibold tracking-tight">${price}</div>
        <div className="text-[11px] text-muted-foreground">Click / Enter</div>
      </div>

      {disabled ? (
        <span className="absolute right-3 top-3 rounded-lg border border-[var(--pos-border)] bg-[var(--pos-surface-2)] px-2 py-1 text-[11px] font-medium text-muted-foreground">
          Sin stock
        </span>
      ) : null}
    </motion.button>
  );
}
