"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Barcode, Plus } from "lucide-react";

import { AnimatedSearchInput } from "@/components/landing/AnimatedSearchInput";
import type { DemoChrome } from "@/components/landing/demo-chrome";
import type { DemoProduct } from "@/components/landing/demo-types";
import { cn } from "@/lib/utils";

type Props = {
  products: DemoProduct[];
  searchQuery: string;
  activeProductId: string | null;
  barcodeValue?: string;
  chrome: DemoChrome;
};

function moneyAr(value: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
}

export function FakePOS({ products, searchQuery, activeProductId, barcodeValue, chrome }: Props) {
  const lower = searchQuery.toLowerCase();
  const visible = lower ? products.filter((p) => p.name.toLowerCase().includes(lower)) : products;

  return (
    <div className={cn("rounded-xl border p-3 sm:rounded-2xl sm:p-4", chrome.posCard)}>
      <div className="mb-2 flex flex-col gap-2 sm:mb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className={cn("text-[10px] uppercase tracking-wide sm:text-xs", chrome.muted)}>POS</div>
          <div className={cn("text-xs font-semibold sm:text-sm", chrome.h3)}>Buscador y productos</div>
        </div>
        <div
          className={cn(
            "inline-flex w-fit shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] sm:px-2.5 sm:py-1 sm:text-[11px]",
            chrome.panelAlt
          )}
        >
          <Barcode className={cn("size-3 sm:size-3.5", chrome.muted)} />
          <span className={chrome.muted}>Escaner</span>
        </div>
      </div>

      <AnimatedSearchInput targetText={searchQuery} chrome={chrome} />
      <AnimatePresence mode="wait">
        {barcodeValue ? (
          <motion.div
            key={barcodeValue}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={cn(
              "mt-2 inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[11px]",
              chrome.scanChip
            )}
          >
            <Barcode className="size-3.5 shrink-0" />
            <span className="min-w-0 truncate">Escaneado: {barcodeValue}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:mt-3 sm:gap-2">
        <AnimatePresence initial={false}>
          {visible.map((p) => {
            const active = p.id === activeProductId;
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, scale: active ? 1.02 : 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
                className={cn(
                  "rounded-lg border p-2 transition sm:rounded-xl sm:p-3",
                  active ? chrome.productTileActive : chrome.productTileIdle
                )}
              >
                <div className="flex items-start justify-between gap-1 sm:gap-2">
                  <div className="min-w-0">
                    <div className={cn("line-clamp-2 text-[11px] font-medium leading-snug sm:text-sm", chrome.h3)}>
                      {p.name}
                    </div>
                    <div className={cn("mt-0.5 text-[10px] sm:text-xs", chrome.muted)}>{moneyAr(p.price)}</div>
                  </div>
                  <motion.div
                    animate={active ? { scale: [1, 1.14, 1] } : { scale: 1 }}
                    transition={{ duration: 0.35 }}
                    className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-md border sm:size-7 sm:rounded-lg", chrome.plusBtn)}
                  >
                    <Plus className="size-3.5 sm:size-4" />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
