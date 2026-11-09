"use client";

import * as React from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  header: React.ReactNode;
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
};

/**
 * Layout POS: mobile-first (columna, carrito abajo, productos con scroll).
 * Desktop: grid 8/4 como antes.
 */
export function POSLayout({ header, left, right, className }: Props) {
  const [productsHidden, setProductsHidden] = React.useState(false);

  return (
    <div
      className={cn(
        "relative isolate flex min-h-0 flex-col overflow-hidden text-foreground",
        "dark:[--foreground:#eaf2ff] dark:[--muted-foreground:#94a3b8] dark:[--background:#0b1220] dark:[--card:#101a2e] dark:[--pos-bg:transparent] dark:[--pos-surface:#101a2e] dark:[--pos-surface-2:#17243a] dark:[--pos-border:rgba(96,165,250,0.24)] dark:text-[#eaf2ff]",
        "bg-[radial-gradient(circle_at_4%_12%,rgba(14,165,233,0.38),transparent_25%),radial-gradient(circle_at_92%_8%,rgba(59,130,246,0.30),transparent_29%),radial-gradient(circle_at_72%_92%,rgba(34,211,238,0.29),transparent_32%),linear-gradient(125deg,transparent_26%,rgba(56,189,248,0.12)_42%,rgba(37,99,235,0.10)_52%,transparent_68%),linear-gradient(135deg,#f8fcff_0%,#e2f3ff_48%,#f7fbff_100%)]",
        "dark:bg-[radial-gradient(circle_at_12%_18%,rgba(14,165,233,0.42),transparent_32%),radial-gradient(circle_at_88%_14%,rgba(124,58,237,0.42),transparent_35%),radial-gradient(circle_at_70%_92%,rgba(34,211,238,0.30),transparent_36%),linear-gradient(135deg,#071b3f_0%,#123b78_48%,#35247c_100%)]",
        "h-[calc(100dvh-7.65rem)] max-lg:pb-0",
        "md:min-h-0",
        className
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-1/3 -z-10 size-72 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-300/35" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-10 -z-10 size-80 rounded-full bg-blue-400/20 blur-3xl dark:bg-violet-300/45" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-56 w-[34rem] -translate-x-1/2 rounded-full bg-sky-300/18 blur-3xl dark:bg-sky-300/40" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-24 -z-10 size-[26rem] rounded-full border-[54px] border-sky-300/15 dark:border-cyan-300/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 right-[8%] -z-10 size-[34rem] rounded-full border-[72px] border-blue-300/12 dark:border-violet-300/10" />

      <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[1500px] flex-1 flex-col gap-2 px-2 py-2 sm:gap-4 sm:px-4 sm:py-4">
        {/* Búsqueda arriba, visible */}
        <div className="sticky top-0 z-20 shrink-0 overflow-hidden rounded-xl border border-sky-300/30 bg-[radial-gradient(circle_at_8%_0%,rgba(56,189,248,.22),transparent_36%),radial-gradient(circle_at_92%_100%,rgba(99,102,241,.18),transparent_38%),linear-gradient(135deg,#102a4f,#123b72_55%,#1e2e62)] p-2 text-white shadow-[0_18px_45px_-24px_rgba(30,64,175,.85)] backdrop-blur-xl sm:rounded-2xl sm:p-4 dark:border-sky-300/20 dark:shadow-[0_18px_50px_-24px_rgba(2,12,50,0.9)]">
          {header}
        </div>

        <div className={cn("hidden shrink-0 justify-end lg:flex", productsHidden ? "w-full" : "ml-auto")}>
          <button
            type="button"
            onClick={() => setProductsHidden((current) => !current)}
            className="inline-flex h-8 items-center gap-2 rounded-lg border border-violet-300/60 bg-white/80 px-3 text-xs font-bold text-violet-800 shadow-sm transition hover:bg-white hover:shadow-md dark:border-blue-300/25 dark:bg-[#17243a] dark:text-blue-200 dark:hover:bg-[#20314d]"
            aria-pressed={productsHidden}
          >
            {productsHidden ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            {productsHidden ? "Volver a productos" : "Usar carrito completo"}
          </button>
        </div>

        <div
          className={cn(
            "grid min-h-0 flex-1 grid-cols-1 gap-2 lg:gap-4",
            productsHidden
              ? "lg:grid-cols-1"
              : "lg:grid-cols-[minmax(0,1fr)_minmax(500px,0.58fr)] xl:grid-cols-[minmax(0,1fr)_540px]"
          )}
        >
          {/* Lista de productos: solo desktop; en móvil el flujo es escaneo + carrito tipo app */}
          <div className={cn("hidden min-h-0 flex-col lg:flex", productsHidden && "lg:hidden")}>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/75 bg-white/72 shadow-[0_18px_45px_-30px_rgba(76,29,149,0.5)] backdrop-blur-xl dark:border-blue-300/20 dark:bg-[#101a2e] dark:text-[#eaf2ff] dark:shadow-[0_22px_55px_-28px_rgba(3,10,35,0.9)]">
              <div className="min-h-0 flex-1 overflow-hidden p-3 sm:p-4">
                {left}
              </div>
            </div>
          </div>

          {/* Carrito: pantalla principal en móvil; columna derecha en desktop */}
          <div className={cn("group/cart flex min-h-0 flex-1 flex-col lg:min-h-0 lg:shrink-0", productsHidden && "w-full")} data-cart-expanded={productsHidden}>
            <div
              className={cn(
                "flex min-h-[min(52dvh,420px)] flex-1 flex-col overflow-hidden rounded-xl border border-white/75 bg-white/78 shadow-[0_20px_50px_-28px_rgba(88,28,135,0.55)] backdrop-blur-xl sm:rounded-2xl dark:border-blue-300/20 dark:bg-[#101a2e] dark:text-[#eaf2ff] dark:shadow-[0_24px_60px_-30px_rgba(3,10,35,0.92)]",
                "max-lg:min-h-0 max-lg:max-h-none",
                "lg:max-h-[calc(100vh-10rem)] lg:h-full lg:shadow-sm",
                "max-lg:z-20"
              )}
            >
              {right}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
