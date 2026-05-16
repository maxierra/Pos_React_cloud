"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type Props = {
  name: string;
  price: number;
  stockLabel: string;
  stockState: "ok" | "low" | "out";
  barcode?: string | null;
  disabled?: boolean;
  onClick: () => void;
  highlight?: boolean;
};

const stockClass: Record<Props["stockState"], string> = {
  ok: "text-emerald-400 font-medium",
  low: "text-[var(--pos-amber)] font-medium",
  out: "text-destructive font-medium",
};

export function ProductTableRow({
  name,
  price,
  stockLabel,
  stockState,
  barcode,
  disabled,
  onClick,
  highlight,
}: Props) {
  return (
    <motion.tr
      onClick={disabled ? undefined : onClick}
      whileTap={disabled ? undefined : { backgroundColor: "rgba(255,255,255,0.02)" }}
      animate={highlight ? { backgroundColor: ["transparent", "var(--pos-glow)", "transparent"] } : {}}
      transition={{ duration: 0.4 }}
      className={cn(
        "group cursor-pointer border-b border-[var(--pos-border)] transition-colors",
        "hover:bg-[var(--pos-surface-2)]",
        disabled && "opacity-40 cursor-not-allowed",
        highlight && "bg-[var(--pos-glow)]/10"
      )}
    >
      <td className="py-3 pl-4 pr-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground/90 group-hover:text-[var(--pos-accent)] transition-colors">
            {name}
          </span>
          {barcode && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {barcode}
            </span>
          )}
        </div>
      </td>
      
      <td className="py-3 px-3">
        <div className={cn("text-xs", stockClass[stockState])}>
          {stockLabel}
        </div>
      </td>

      <td className="py-3 px-3 text-right">
        <div className="font-numeric text-sm font-bold text-foreground">
          ${price.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
        </div>
      </td>

      <td className="py-3 pl-3 pr-4 text-right">
        <div className="flex items-center justify-end">
             <div className="rounded-lg border border-[var(--pos-border)] bg-[var(--pos-surface)] px-2 py-0.5 text-[10px] font-medium text-muted-foreground group-hover:border-[var(--pos-accent)] group-hover:text-[var(--pos-accent)] transition-all">
                AGREGAR
              </div>
        </div>
      </td>
    </motion.tr>
  );
}
