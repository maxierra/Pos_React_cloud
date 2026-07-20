"use client";

import * as React from "react";

export type CartItem = {
  line_id: string;
  product_id: string | null;
  name: string;
  sold_by_weight: boolean;
  unit_price: number;
  quantity: number;
  quick_sale_category_id?: string | null;
};

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const WEIGHT_STEP_KG = 0.05;

export function useCart() {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [lastAddedProductId, setLastAddedProductId] = React.useState<string | null>(null);

  const total = React.useMemo(() => {
    return round2(items.reduce((acc, it) => acc + it.quantity * it.unit_price, 0));
  }, [items]);

  const add = React.useCallback((p: {
    id: string;
    name: string;
    sold_by_weight: boolean;
    price: number;
  }, opts?: { quantity?: number }) => {
    setItems((prev) => {
      const existing = prev.find((x) => x.product_id === p.id);
      const step = p.sold_by_weight ? WEIGHT_STEP_KG : 1;
      const qty = opts?.quantity ?? step;
      if (!existing) {
        return [
          ...prev,
          {
            line_id: p.id,
            product_id: p.id,
            name: p.name,
            sold_by_weight: p.sold_by_weight,
            unit_price: p.price,
            quantity: qty,
          },
        ];
      }
      return prev.map((x) => (x.product_id === p.id ? { ...x, quantity: round2(x.quantity + qty) } : x));
    });
    setLastAddedProductId(p.id);
  }, []);

  const addQuickSale = React.useCallback((entry: {
    categoryId: string;
    categoryName: string;
    amount: number;
  }) => {
    const lineId = `quick-sale:${entry.categoryId}`;
    setItems((prev) => {
      const existing = prev.find((x) => x.line_id === lineId);
      if (!existing) {
        return [
          ...prev,
          {
            line_id: lineId,
            product_id: null,
            quick_sale_category_id: entry.categoryId,
            name: entry.categoryName,
            sold_by_weight: false,
            unit_price: round2(entry.amount),
            quantity: 1,
          },
        ];
      }
      return prev.map((x) =>
        x.line_id === lineId
          ? { ...x, quantity: round2(x.quantity + 1), unit_price: round2(entry.amount), name: entry.categoryName }
          : x
      );
    });
    setLastAddedProductId(lineId);
  }, []);

  const setQty = React.useCallback((lineId: string, qty: number) => {
    const clean = round2(qty);
    setItems((prev) => prev.map((x) => (x.line_id === lineId ? { ...x, quantity: clean } : x)).filter((x) => x.quantity > 0));
  }, []);

  const inc = React.useCallback((item: CartItem) => {
    const step = item.sold_by_weight ? WEIGHT_STEP_KG : 1;
    setQty(item.line_id, item.quantity + step);
  }, [setQty]);

  const dec = React.useCallback((item: CartItem) => {
    const step = item.sold_by_weight ? WEIGHT_STEP_KG : 1;
    setQty(item.line_id, item.quantity - step);
  }, [setQty]);

  const remove = React.useCallback((lineId: string) => {
    setItems((prev) => prev.filter((x) => x.line_id !== lineId));
  }, []);

  const clear = React.useCallback(() => {
    setItems([]);
  }, []);

  const replace = React.useCallback((nextItems: CartItem[]) => {
    setItems(nextItems);
  }, []);

  const consumeLastAdded = React.useCallback(() => {
    setLastAddedProductId(null);
  }, []);

  return {
    items,
    total,
    lastAddedProductId,
    add,
    addQuickSale,
    setQty,
    inc,
    dec,
    remove,
    clear,
    replace,
    consumeLastAdded,
  };
}
