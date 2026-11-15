"use client";

import { Clock3, Trash2, X } from "lucide-react";

import type { HeldSaleRow } from "@/app/app/(main)/pos/held-sales-actions";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  rows: HeldSaleRow[];
  loading: boolean;
  onClose: () => void;
  onResume: (row: HeldSaleRow) => void;
  onDelete: (row: HeldSaleRow) => void;
};

function money(value: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value);
}
export function HeldSalesModal({ open, rows, loading, onClose, onResume, onDelete }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Ventas en espera</h2>
            <p className="text-xs text-muted-foreground">Retomá el carrito cuando vuelva el cliente.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="size-4" />
          </Button>
        </div>
        <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto">
          {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Cargando…</p> : null}
          {!loading && rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No hay ventas en espera.</p>
          ) : null}
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border bg-muted/25 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{row.label}</div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock3 className="size-3" />
                    {new Date(row.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    <span>·</span>
                    <span>{row.items.length} productos</span>
                  </div>
                </div>
                <div className="text-right font-bold">{money(row.total_snapshot)}</div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button type="button" className="flex-1" onClick={() => onResume(row)}>Retomar venta</Button>
                <Button type="button" variant="outline" size="icon" onClick={() => onDelete(row)} aria-label={`Eliminar ${row.label}`}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
