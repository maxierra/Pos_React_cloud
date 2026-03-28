"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ShoppingCart, Wallet } from "lucide-react";

import type { DemoChrome } from "@/components/landing/demo-chrome";
import type { DemoCartLine } from "@/components/landing/demo-types";
import { cn } from "@/lib/utils";

type Props = {
  lines: DemoCartLine[];
  total: number;
  paymentMethod: "cash" | "card" | "transfer" | null;
  salePulseKey: number;
  chrome: DemoChrome;
};

function moneyAr(value: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
}

function methodLabel(method: Props["paymentMethod"]) {
  if (method === "cash") return "Efectivo";
  if (method === "card") return "Tarjeta";
  if (method === "transfer") return "Transferencia";
  return "-";
}

export function FakeCart({ lines, total, paymentMethod, salePulseKey, chrome }: Props) {
  return (
    <div className={cn("rounded-xl border p-3 sm:rounded-2xl sm:p-4", chrome.cartCard)}>
      <div className="mb-2 flex items-center justify-between sm:mb-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold sm:gap-2 sm:text-sm">
          <ShoppingCart className={cn("size-4", chrome.accent)} />
          <span className={chrome.h3}>Carrito activo</span>
        </div>
        <div className={cn("text-xs", chrome.muted)}>
          {lines.reduce((acc, l) => acc + l.qty, 0)} items
        </div>
      </div>

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {lines.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn("rounded-xl border p-4 text-xs", chrome.cartEmpty)}
            >
              Esperando productos...
            </motion.div>
          ) : (
            lines.map((line) => (
              <motion.div
                key={line.productId}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className={cn("rounded-xl border p-2.5", chrome.cartLine)}
              >
                <div className={cn("flex items-center justify-between text-sm", chrome.h3)}>
                  <span>{line.name}</span>
                  <span className="font-medium">{moneyAr(line.qty * line.price)}</span>
                </div>
                <div className={cn("mt-1 text-[11px]", chrome.muted)}>
                  {line.qty} x {moneyAr(line.price)}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <motion.div
        key={salePulseKey}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 0.5 }}
        className={cn("mt-3 rounded-xl border p-3", chrome.cartTotalBox)}
      >
        <div className={cn("text-xs", chrome.muted)}>Total</div>
        <div className={cn("text-2xl font-semibold", chrome.cartTotalValue)}>{moneyAr(total)}</div>
      </motion.div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className={cn("rounded-lg border p-2", chrome.payRow)}>
          <div className={cn("inline-flex items-center gap-1 text-[11px]", chrome.muted)}>
            <Wallet className="size-3.5" />
            Metodo
          </div>
          <div className={cn("text-sm", chrome.h3)}>{methodLabel(paymentMethod)}</div>
        </div>
        <motion.div
          key={`status-${salePulseKey}`}
          initial={{ opacity: 0.35 }}
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          className={cn("rounded-lg border p-2", chrome.cartFlowBox)}
        >
          <div className={cn("inline-flex items-center gap-1 text-[11px]", chrome.cartFlowText)}>
            <CheckCircle2 className="size-3.5" />
            Flujo
          </div>
          <div className={cn("text-sm", chrome.cartFlowText)}>Cobro automatico</div>
        </motion.div>
      </div>
    </div>
  );
}
