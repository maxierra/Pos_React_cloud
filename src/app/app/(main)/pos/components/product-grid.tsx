"use client";

import * as React from "react";
import { PackagePlus } from "lucide-react";

import { ProductCard } from "@/app/app/(main)/pos/components/ProductCard";
import type { PosProduct } from "@/app/app/(main)/pos/hooks/use-products";
import { cn } from "@/lib/utils";

const neonTones = [
  "border-cyan-300/80 shadow-[0_0_18px_-8px_rgba(6,182,212,.75)] hover:border-cyan-400 hover:shadow-[0_0_26px_-7px_rgba(6,182,212,.9)] dark:border-cyan-400/45",
  "border-blue-300/80 shadow-[0_0_18px_-8px_rgba(59,130,246,.75)] hover:border-blue-400 hover:shadow-[0_0_26px_-7px_rgba(59,130,246,.9)] dark:border-blue-400/45",
  "border-violet-300/80 shadow-[0_0_18px_-8px_rgba(139,92,246,.72)] hover:border-violet-400 hover:shadow-[0_0_26px_-7px_rgba(139,92,246,.9)] dark:border-violet-400/45",
  "border-fuchsia-300/75 shadow-[0_0_18px_-8px_rgba(217,70,239,.68)] hover:border-fuchsia-400 hover:shadow-[0_0_26px_-7px_rgba(217,70,239,.85)] dark:border-fuchsia-400/40",
  "border-emerald-300/80 shadow-[0_0_18px_-8px_rgba(16,185,129,.7)] hover:border-emerald-400 hover:shadow-[0_0_26px_-7px_rgba(16,185,129,.88)] dark:border-emerald-400/45",
] as const;

type Props = {
  products: PosProduct[];
  onAdd: (p: PosProduct) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  mode?: "table" | "catalog";
  lastAddedProductId?: string | null;
  onConsumeLastAdded?: () => void;
  page?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
};

export function ProductGrid({
  products,
  onAdd,
  onLoadMore,
  hasMore,
  mode = "table",
  lastAddedProductId,
  onConsumeLastAdded,
  page,
  totalPages,
  totalCount,
  onPageChange,
}: Props) {
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          onLoadMore();
        }
      },
      { root: null, threshold: 0.1 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, onLoadMore]);

  React.useEffect(() => {
    if (!lastAddedProductId) return;
    const t = window.setTimeout(() => {
      onConsumeLastAdded?.();
    }, 250);
    return () => window.clearTimeout(t);
  }, [lastAddedProductId, onConsumeLastAdded]);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-blue-200/80 bg-white shadow-[0_18px_45px_-32px_rgba(37,99,235,.55)] dark:border-blue-300/20 dark:bg-[var(--pos-surface)]">
      {mode === "catalog" ? (
        <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
          {products.map((p) => {
            const highlight = lastAddedProductId === p.id;
            const stockValue = p.sold_by_weight ? p.stock_decimal : p.stock;
            const stockState = stockValue <= 0 ? "out" : stockValue < 5 ? "low" : "ok";
            const disabled = stockValue <= 0;
            return (
              <ProductCard
                key={p.id}
                name={p.name}
                imageUrl={p.image_url}
                price={p.price}
                stockLabel={p.sold_by_weight ? `${p.stock_decimal} kg` : `${p.stock} u.`}
                stockState={stockState}
                disabled={disabled}
                highlight={highlight}
                onClick={() => onAdd(p)}
              />
            );
          })}
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 auto-rows-[minmax(172px,1fr)] grid-cols-2 gap-2.5 overflow-y-auto bg-slate-50/80 p-2.5 md:grid-cols-3 xl:grid-cols-4 dark:bg-[#0a1629]">
          {products.map((p, index) => {
            const highlight = lastAddedProductId === p.id;
            const stockValue = p.sold_by_weight ? p.stock_decimal : p.stock;
            const stockState = stockValue <= 0 ? "out" : stockValue < 5 ? "low" : "ok";
            const disabled = stockValue <= 0;
            const stockLabel = p.sold_by_weight ? `${p.stock_decimal} kg` : `${p.stock} u.`;
            return (
              <button
                key={p.id}
                type="button"
                disabled={disabled}
                onClick={() => onAdd(p)}
                className={cn(
                  "pos-product-tile group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                  neonTones[index % neonTones.length],
                  disabled && "cursor-not-allowed opacity-45 grayscale",
                  highlight && "ring-2 ring-emerald-400 shadow-[0_0_28px_-5px_rgba(52,211,153,.95)]"
                )}
              >
                <span aria-hidden className="absolute -right-5 -top-6 size-16 rounded-full border border-current opacity-[0.08] transition-transform group-hover:scale-125" />
                <div className="relative min-w-0">
                  <div className="mb-1.5 flex items-start justify-between gap-1">
                    <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide", stockState === "ok" && "border-emerald-400/45 bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300", stockState === "low" && "border-amber-400/50 bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300", stockState === "out" && "border-rose-400/50 bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300")}>{disabled ? "Sin stock" : `Stock ${stockLabel}`}</span>
                    <PackagePlus className="size-4 shrink-0 text-blue-600 transition-transform group-hover:scale-110 dark:text-cyan-300" />
                  </div>
                  <div className="pos-product-name line-clamp-2 min-h-10 text-[13px] font-extrabold leading-5">{p.name}</div>
                  <div className="pos-product-meta mt-1 truncate font-mono text-[10px] font-medium">{p.barcode || p.category || "Sin código"}</div>
                </div>
                <div className="relative mt-2 flex items-end justify-between gap-2 border-t border-blue-200/70 pt-2 dark:border-blue-300/20">
                  <div><div className="pos-product-meta text-[8px] font-bold uppercase tracking-[0.14em]">Precio</div><div className="pos-product-price text-lg font-black tabular-nums">${p.price.toLocaleString("es-AR")}</div></div>
                  <span className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-[9px] font-extrabold text-white shadow-md transition group-hover:bg-cyan-500">Agregar</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {hasMore ? (
        <div ref={sentinelRef} className="flex items-center justify-center py-4 text-xs text-muted-foreground">
          Cargando más productos...
        </div>
      ) : null}

      {page && totalPages && onPageChange ? (
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--pos-border)] bg-[var(--pos-surface-2)]/70 px-3 py-2.5">
          <div className="text-[11px] font-medium text-muted-foreground">
            Página {page} de {totalPages} · {totalCount ?? products.length} productos
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="h-8 rounded-lg border border-[var(--pos-border)] bg-[var(--pos-surface)] px-3 text-xs font-semibold transition hover:border-blue-400 disabled:pointer-events-none disabled:opacity-40">Anterior</button>
            <span className="min-w-10 rounded-lg bg-blue-600 px-2 py-1.5 text-center text-xs font-bold text-white shadow-sm">{page}</span>
            <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="h-8 rounded-lg border border-[var(--pos-border)] bg-[var(--pos-surface)] px-3 text-xs font-semibold transition hover:border-blue-400 disabled:pointer-events-none disabled:opacity-40">Siguiente</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
