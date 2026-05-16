"use client";

import * as React from "react";

export type PosProduct = {
  id: string;
  name: string;
  price: number;
  sold_by_weight: boolean;
  stock: number;
  stock_decimal: number;
  barcode?: string | null;
  scale_code?: string | null;
};

export function useProducts(products: PosProduct[]) {
  const [query, setQuery] = React.useState("");
  const [visibleCount, setVisibleCount] = React.useState(48);

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = React.useMemo(() => {
    if (!normalizedQuery) return products;

    return products.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(normalizedQuery);
      const barcodeMatch = (p.barcode ?? "").toLowerCase() === normalizedQuery;
      const scaleCodeMatch = (p.scale_code ?? "").toLowerCase() === normalizedQuery;
      return nameMatch || barcodeMatch || scaleCodeMatch;
    });
  }, [products, normalizedQuery]);

  const visible = React.useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const resetPaging = React.useCallback(() => {
    setVisibleCount(48);
  }, []);

  React.useEffect(() => {
    resetPaging();
  }, [normalizedQuery, resetPaging]);

  const loadMore = React.useCallback(() => {
    setVisibleCount((c) => Math.min(c + 48, filtered.length));
  }, [filtered.length]);

  const findByBarcodeOrName = React.useCallback(
    (q: string) => {
      const trimmed = q.trim().toLowerCase();
      if (!trimmed) return null;

      const digitsOnly = trimmed.replace(/\s+/g, "");

      const byBarcode = products.find(
        (p) => (p.barcode ?? "").replace(/\s+/g, "").toLowerCase() === digitsOnly
      );
      if (byBarcode) return byBarcode;

      const byScaleCode = products.find((p) => (p.scale_code ?? "").toLowerCase() === trimmed);
      if (byScaleCode) return byScaleCode;

      const byName = products.find((p) => p.name.toLowerCase().includes(trimmed));
      return byName ?? null;
    },
    [products]
  );

  return {
    query,
    setQuery,
    filteredCount: filtered.length,
    visible,
    visibleCount,
    loadMore,
    findByBarcodeOrName,
  };
}
