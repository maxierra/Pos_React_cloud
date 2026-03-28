"use client";

import * as React from "react";
import { Download, PackageSearch, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { exportToExcel } from "@/lib/excel-utils";
import { cn } from "@/lib/utils";

export type InventoryProductRow = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  scale_code: string | null;
  category: string | null;
  price: string | number;
  cost: string | number;
  sold_by_weight: boolean;
  stock: number;
  stock_decimal: string | number;
  low_stock_threshold: number;
  low_stock_threshold_decimal: string | number;
  expires_at: string | null;
  active: boolean;
  created_at?: string;
};

type Props = {
  products: InventoryProductRow[];
};

function toNumber(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function isLowStock(p: InventoryProductRow) {
  if (p.sold_by_weight) {
    return toNumber(p.stock_decimal) <= toNumber(p.low_stock_threshold_decimal);
  }
  return toNumber(p.stock) <= toNumber(p.low_stock_threshold);
}

function daysUntil(dateIso: string) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = d.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function formatDateAr(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-AR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function InventoryClient({ products }: Props) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [onlyLowStock, setOnlyLowStock] = React.useState(false);
  const [onlyActive, setOnlyActive] = React.useState(true);
  const [expiringDays, setExpiringDays] = React.useState("30");
  const [onlyExpiring, setOnlyExpiring] = React.useState(false);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      const c = (p.category ?? "").trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const cat = category.trim().toLowerCase();
    const expDays = Math.max(0, Math.min(365, Number(expiringDays || 0)));

    return products.filter((p) => {
      if (onlyActive && !p.active) return false;

      if (cat) {
        const c = (p.category ?? "").trim().toLowerCase();
        if (c !== cat) return false;
      }

      if (q) {
        const hay = `${p.name} ${p.sku ?? ""} ${p.barcode ?? ""} ${p.scale_code ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (onlyLowStock && !isLowStock(p)) return false;

      if (onlyExpiring) {
        if (!p.expires_at) return false;
        const d = daysUntil(p.expires_at);
        if (d == null) return false;
        if (d < 0) return true; // ya vencido
        return d <= expDays;
      }

      return true;
    });
  }, [products, query, category, onlyLowStock, onlyActive, expiringDays, onlyExpiring]);

  const totals = React.useMemo(() => {
    const allActive = products.filter((p) => p.active);
    const low = allActive.filter(isLowStock);
    const expired = allActive.filter((p) => (p.expires_at ? (daysUntil(p.expires_at) ?? 999999) < 0 : false));
    const expDays = Math.max(0, Math.min(365, Number(expiringDays || 0)));
    const expSoon = allActive.filter((p) => {
      if (!p.expires_at) return false;
      const d = daysUntil(p.expires_at);
      if (d == null) return false;
      return d >= 0 && d <= expDays;
    });

    return {
      products: allActive.length,
      low: low.length,
      expired: expired.length,
      expSoon: expSoon.length,
    };
  }, [products, expiringDays]);

  const exportExcel = React.useCallback(() => {
    const expDays = Math.max(0, Math.min(365, Number(expiringDays || 0)));

    const rows = filtered.map((p) => {
      const low = isLowStock(p);
      const d = p.expires_at ? daysUntil(p.expires_at) : null;
      const expLabel =
        d == null
          ? "—"
          : d < 0
            ? `Vencido (${Math.abs(d)} días)`
            : d === 0
              ? "Vence hoy"
              : `Vence en ${d} días`;

      return {
        Producto: p.name,
        Categoría: p.category ?? "",
        SKU: p.sku ?? "",
        Barcode: p.barcode ?? "",
        "Stock": p.sold_by_weight ? toNumber(p.stock_decimal) : toNumber(p.stock),
        "Mínimo": p.sold_by_weight ? toNumber(p.low_stock_threshold_decimal) : toNumber(p.low_stock_threshold),
        "Poco stock": low ? "Sí" : "No",
        "Vence": p.expires_at ? formatDateAr(p.expires_at) : "",
        "Estado venc.": expLabel,
        Activo: p.active ? "Sí" : "No",
      };
    });

    exportToExcel(rows, `inventario_${expDays}d`);
  }, [filtered, expiringDays]);

  return (
    <div className="mt-6 grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-emerald-500/25 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-700/80 dark:text-emerald-300">Productos activos</CardDescription>
            <CardTitle className="text-2xl text-emerald-800 dark:text-emerald-200">{totals.products}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-amber-500/25 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-amber-700/80 dark:text-amber-300">Poco stock</CardDescription>
            <CardTitle className="text-2xl text-amber-800 dark:text-amber-200">{totals.low}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-violet-500/25 bg-violet-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-violet-700/80 dark:text-violet-300">Por vencer (≤ {expiringDays} días)</CardDescription>
            <CardTitle className="text-2xl text-violet-800 dark:text-violet-200">{totals.expSoon}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-rose-500/25 bg-rose-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-rose-700/80 dark:text-rose-300">Vencidos</CardDescription>
            <CardTitle className="text-2xl text-rose-800 dark:text-rose-200">{totals.expired}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-2xl">
        <CardHeader className="border-b bg-[var(--pos-surface)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2">
                <PackageSearch className="size-4 text-emerald-500" />
                Filtros
              </CardTitle>
              <CardDescription>Buscá productos y filtrá alertas de stock y vencimientos.</CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={exportExcel} className="h-10 rounded-xl">
              <Download className="size-4" />
              Exportar Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-query" className="text-xs text-muted-foreground">Buscar</Label>
              <Input
                id="inv-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nombre, SKU, barcode…"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-category" className="text-xs text-muted-foreground">Categoría</Label>
              <select
                id="inv-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm"
              >
                <option value="">Todas</option>
                {categories.map((c) => (
                  <option key={c} value={c.toLowerCase()}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-exp" className="text-xs text-muted-foreground">Por vencer (días)</Label>
              <Input
                id="inv-exp"
                type="number"
                min={0}
                max={365}
                value={expiringDays}
                onChange={(e) => setExpiringDays(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="grid gap-2">
              <div className="text-xs text-muted-foreground">Opciones</div>
              <label className="flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2">
                <span className="text-sm">Solo activos</span>
                <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2">
                <span className="text-sm">Solo poco stock</span>
                <input type="checkbox" checked={onlyLowStock} onChange={(e) => setOnlyLowStock(e.target.checked)} />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2">
                <span className="text-sm">Solo por vencer / vencidos</span>
                <input type="checkbox" checked={onlyExpiring} onChange={(e) => setOnlyExpiring(e.target.checked)} />
              </label>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Mostrando {filtered.length} de {products.length} productos
          </div>

          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="overflow-auto">
              <table className="w-full min-w-[960px] text-sm">
                <thead className="bg-[var(--pos-surface-2)] text-muted-foreground">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium">Producto</th>
                    <th className="px-4 py-3 text-left font-medium">Categoría</th>
                    <th className="px-4 py-3 text-left font-medium">Stock</th>
                    <th className="px-4 py-3 text-left font-medium">Mínimo</th>
                    <th className="px-4 py-3 text-left font-medium">Vence</th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                        No hay productos con esos filtros.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => {
                      const low = isLowStock(p);
                      const d = p.expires_at ? daysUntil(p.expires_at) : null;
                      const expSoon = d != null && d >= 0 && d <= Math.max(0, Number(expiringDays || 0));
                      const expired = d != null && d < 0;

                      return (
                        <tr key={p.id} className="border-b last:border-b-0">
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{p.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {p.sku ? `SKU: ${p.sku}` : null}
                              {p.barcode ? (p.sku ? " · " : "") + `Barcode: ${p.barcode}` : null}
                            </div>
                          </td>
                          <td className="px-4 py-3">{p.category ?? "—"}</td>
                          <td className="px-4 py-3">
                            {p.sold_by_weight ? toNumber(p.stock_decimal) : toNumber(p.stock)}
                          </td>
                          <td className="px-4 py-3">
                            {p.sold_by_weight ? toNumber(p.low_stock_threshold_decimal) : toNumber(p.low_stock_threshold)}
                          </td>
                          <td className="px-4 py-3">{p.expires_at ? formatDateAr(p.expires_at) : "—"}</td>
                          <td className="px-4 py-3">
                            <div
                              className={cn(
                                "inline-flex items-center gap-2 rounded-xl border px-3 py-1 text-xs font-medium",
                                low ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200" : "border-[var(--pos-border)] bg-[var(--pos-surface)]",
                                expired ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-200" : "",
                                expSoon && !expired ? "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-200" : ""
                              )}
                            >
                              {(expired || low || expSoon) ? <TriangleAlert className="size-3.5" /> : null}
                              {expired
                                ? "Vencido"
                                : expSoon
                                  ? "Por vencer"
                                  : low
                                    ? "Poco stock"
                                    : "OK"}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
