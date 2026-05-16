"use client";

import * as React from "react";

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
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col bg-[var(--pos-bg)] text-foreground",
        "min-h-[calc(100dvh-7rem)] max-lg:pb-[env(safe-area-inset-bottom)]",
        "md:min-h-[calc(100vh-140px)]",
        className
      )}
    >
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-1 flex-col gap-3 px-3 pt-2 sm:gap-4 sm:px-4 sm:py-4">
        {/* Búsqueda arriba, visible */}
        <div className="sticky top-0 z-20 shrink-0 rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface)] p-3 shadow-sm sm:p-4">
          {header}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
          {/* Lista de productos: solo desktop; en móvil el flujo es escaneo + carrito tipo app */}
          <div className="hidden min-h-0 flex-col lg:col-span-8 lg:flex">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface)] shadow-sm">
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 lg:max-h-none">
                {left}
              </div>
            </div>
          </div>

          {/* Carrito: pantalla principal en móvil; columna derecha en desktop */}
          <div className="flex min-h-0 flex-1 flex-col lg:col-span-4 lg:min-h-0 lg:shrink-0">
            <div
              className={cn(
                "flex min-h-[min(52dvh,420px)] flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface)] shadow-lg",
                "max-lg:min-h-0 max-lg:max-h-none",
                "lg:max-h-[calc(100vh-10rem)] lg:h-full lg:shadow-sm",
                "max-lg:sticky max-lg:bottom-[max(0.5rem,env(safe-area-inset-bottom))] max-lg:z-30"
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
