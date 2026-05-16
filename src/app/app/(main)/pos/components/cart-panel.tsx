"use client";

import * as React from "react";

import { Minus, Plus, Trash2 } from "lucide-react";

import type { CartItem } from "@/app/app/(main)/pos/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  items: CartItem[];
  total: number;
  pending: boolean;
  onInc: (item: CartItem) => void;
  onDec: (item: CartItem) => void;
  onSetQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  onOpenPayment: () => void;
  lastAddedProductId?: string | null;
};

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function CartPanel({
  items,
  total,
  pending,
  onInc,
  onDec,
  onSetQty,
  onRemove,
  onOpenPayment,
  lastAddedProductId,
}: Props) {
  return (
    <div className="flex h-full flex-col rounded-xl border bg-card">
      <div className="border-b p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-tight">Carrito</div>
            <div className="text-xs text-muted-foreground">{items.length} ítems</div>
          </div>
          <div className="text-2xl font-semibold tracking-tight">${total}</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {items.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">Agregá productos para cobrar.</div>
        ) : (
          <div className="grid gap-2">
            {items.map((item) => {
              const highlight = lastAddedProductId === item.product_id;
              return (
                <div
                  key={item.product_id}
                  className={
                    "rounded-xl border p-3 transition " +
                    (highlight ? "ring-2 ring-primary" : "")
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{item.name}</div>
                      <div className="text-xs text-muted-foreground">${item.unit_price} c/u</div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(item.product_id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" onClick={() => onDec(item)}>
                        <Minus className="size-4" />
                      </Button>
                      <Input
                        value={item.quantity}
                        onChange={(e) => onSetQty(item.product_id, Number(e.target.value) || 0)}
                        type="number"
                        step={item.sold_by_weight ? 0.1 : 1}
                        inputMode={item.sold_by_weight ? "decimal" : "numeric"}
                        className="h-10 w-24 text-center"
                      />
                      <Button type="button" variant="outline" size="icon" onClick={() => onInc(item)}>
                        <Plus className="size-4" />
                      </Button>
                    </div>

                    <div className="text-sm font-semibold">${round2(item.quantity * item.unit_price)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t p-4">
        <Button type="button" className="h-12 w-full text-base" disabled={pending || items.length === 0} onClick={onOpenPayment}>
          Cobrar
        </Button>
      </div>
    </div>
  );
}
