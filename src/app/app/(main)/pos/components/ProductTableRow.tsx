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
  ok: "text-emerald-600 font-medium dark:text-emerald-400",
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
      whileTap={disabled ? undefined : { scale: 0.998 }}
      className={cn(
        "group relative cursor-pointer border-b border-blue-100 bg-white transition-[background-color,box-shadow,transform] duration-200 even:bg-sky-50/55 dark:border-blue-300/15 dark:bg-[#101a2e] dark:even:bg-[#142139]",
        "hover:bg-blue-50 hover:shadow-[inset_3px_0_0_#3b82f6] dark:hover:bg-[#1a2b47]",
        disabled && "opacity-40 cursor-not-allowed",
        highlight &&
          "bg-emerald-500/[0.10] shadow-[inset_3px_0_0_var(--pos-accent)] dark:bg-emerald-400/[0.08]"
      )}
    >
      <td className="py-3 pl-4 pr-3">
        <div className="flex flex-col">
          <span
            className={cn(
              "text-sm font-semibold text-slate-800 transition-colors group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300",
              highlight && "text-emerald-800 dark:text-emerald-200"
            )}
          >
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
        <div className="font-numeric text-sm font-extrabold text-slate-900 dark:text-white">
          ${price.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
        </div>
      </td>

      <td className="py-3 pl-3 pr-4 text-right">
        <div className="flex items-center justify-end">
             <div className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600 transition-all group-hover:border-blue-500 group-hover:bg-blue-600 group-hover:text-white dark:border-blue-300/25 dark:bg-blue-500/10 dark:text-blue-300 dark:group-hover:bg-blue-500">
                AGREGAR
              </div>
        </div>
      </td>
    </motion.tr>
  );
}
