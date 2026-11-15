"use client";

import * as React from "react";
import { AlertTriangle, PackagePlus, X } from "lucide-react";
import type { PosProduct } from "@/app/app/(main)/pos/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = { product: PosProduct; requestedQuantity: number; canEditStock: boolean; pending: boolean; onClose: () => void; onSave: (stock: number) => void };

export function StockProtectionModal({ product, requestedQuantity, canEditStock, pending, onClose, onSave }: Props) {
  const currentStock = product.sold_by_weight ? product.stock_decimal : product.stock;
  const [draft, setDraft] = React.useState(() => String(Math.max(currentStock, requestedQuantity)));
  const unit = product.sold_by_weight ? "kg" : "unidades";
  const value = Number(String(draft).replace(",", "."));
  const valid = Number.isFinite(value) && value >= requestedQuantity && value >= 0;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="stock-protection-title">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-amber-300/50 bg-background shadow-2xl">
        <div className="flex items-start gap-3 bg-gradient-to-r from-amber-500/15 to-orange-500/10 p-5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white"><AlertTriangle className="size-5" /></div>
          <div className="min-w-0 flex-1"><h2 id="stock-protection-title" className="text-lg font-black">Stock insuficiente</h2><p className="mt-1 text-sm text-muted-foreground">{product.name}</p></div>
          <button type="button" onClick={onClose} disabled={pending} className="rounded-full p-2 hover:bg-black/5" aria-label="Cerrar"><X className="size-4" /></button>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border bg-muted/40 p-3"><div className="text-[10px] font-bold uppercase text-muted-foreground">Disponible</div><div className="mt-1 text-xl font-black text-rose-600">{currentStock} {unit}</div></div>
            <div className="rounded-2xl border bg-muted/40 p-3"><div className="text-[10px] font-bold uppercase text-muted-foreground">Intentás vender</div><div className="mt-1 text-xl font-black">{requestedQuantity} {unit}</div></div>
          </div>
          {canEditStock ? <>
            <label className="block text-sm font-bold">Nuevo stock disponible<Input type="number" min={requestedQuantity} step={product.sold_by_weight ? "0.001" : "1"} value={draft} onChange={(event) => setDraft(event.target.value)} className="mt-2 h-12 text-lg font-bold" autoFocus /></label>
            {!valid ? <p className="text-xs font-medium text-rose-600">Debe ser igual o mayor a {requestedQuantity} {unit}.</p> : null}
            <p className="text-xs text-muted-foreground">Al guardar se actualiza el inventario y se agrega la cantidad solicitada.</p>
          </> : <p className="rounded-2xl bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">No tenés permiso para editar stock. Pedile al dueño que lo actualice o habilite el permiso.</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose} disabled={pending}>Cancelar</Button>{canEditStock ? <Button type="button" onClick={() => onSave(value)} disabled={pending || !valid} className="gap-2"><PackagePlus className="size-4" />{pending ? "Guardando..." : "Actualizar y agregar"}</Button> : null}</div>
        </div>
      </div>
    </div>
  );
}
