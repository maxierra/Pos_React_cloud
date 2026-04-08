"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Plus, ScanBarcode, ScanLine, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { parseScaleBarcode } from "@/app/app/(main)/pos/utils/scale-barcode";
import { createProduct, deleteProduct, updateProduct } from "@/app/app/(main)/products/actions";
import { ProductForm } from "@/app/app/(main)/products/product-form";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsMobilePos } from "@/hooks/use-is-mobile-pos";
import { cn } from "@/lib/utils";

type ProductRow = {
  id: string;
  name: string;
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
};

type Props = {
  products: ProductRow[];
  canEditPrice?: boolean;
  canEditStock?: boolean;
};

function formatStock(p: ProductRow) {
  return p.sold_by_weight
    ? `Stock: ${p.stock_decimal} | Mín: ${p.low_stock_threshold_decimal}`
    : `Stock: ${p.stock} | Mín: ${p.low_stock_threshold}`;
}

function normCode(s: string) {
  return String(s ?? "").replace(/\s+/g, "").trim().toLowerCase();
}

function findProductByScannedCode(products: ProductRow[], raw: string): ProductRow | undefined {
  const stable = normCode(raw);
  if (!stable) return undefined;

  const exact = products.find((p) => normCode(p.barcode ?? "") === stable);
  if (exact) return exact;

  const parsed = parseScaleBarcode(stable.replace(/\s+/g, ""));
  if (parsed) {
    const sc = (parsed.scaleCode ?? "").toLowerCase();
    return products.find((p) => (p.scale_code ?? "").toLowerCase() === sc);
  }

  return undefined;
}

export function ProductsClient({ products, canEditPrice = true, canEditStock = true }: Props) {
  const router = useRouter();
  const isMobileAssist = useIsMobilePos();
  const [openCreate, setOpenCreate] = React.useState(false);
  const [editProduct, setEditProduct] = React.useState<ProductRow | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [scannerSearchOpen, setScannerSearchOpen] = React.useState(false);

  const [nameQuery, setNameQuery] = React.useState("");
  const [barcodeQuery, setBarcodeQuery] = React.useState("");
  const barcodeSearchRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    const nq = nameQuery.trim().toLowerCase();
    const bq = normCode(barcodeQuery);

    return products.filter((p) => {
      if (nq && !p.name.toLowerCase().includes(nq)) return false;
      if (bq) {
        const b = normCode(p.barcode ?? "");
        const sc = normCode(p.scale_code ?? "");
        if (!b.includes(bq) && !sc.includes(bq)) return false;
      }
      return true;
    });
  }, [products, nameQuery, barcodeQuery]);

  const hasActiveFilters = Boolean(nameQuery.trim() || normCode(barcodeQuery));

  const onCreate = React.useCallback(
    async (formData: FormData) => {
      startTransition(() => {
        (async () => {
          try {
            await createProduct(formData);
            toast.success("Producto creado");
            setOpenCreate(false);
            router.refresh();
          } catch (err) {
            toast.error("No se pudo crear", {
              description: err instanceof Error ? err.message : "Error",
            });
          }
        })();
      });
    },
    [router]
  );

  const onUpdate = React.useCallback(
    async (formData: FormData) => {
      startTransition(() => {
        (async () => {
          try {
            await updateProduct(formData);
            toast.success("Producto actualizado");
            setEditProduct(null);
            router.refresh();
          } catch (err) {
            toast.error("No se pudo guardar", {
              description: err instanceof Error ? err.message : "Error",
            });
          }
        })();
      });
    },
    [router]
  );

  const onDelete = React.useCallback(
    async (id: string) => {
      const ok = window.confirm("¿Borrar este producto? Esta acción no se puede deshacer.");
      if (!ok) return;

      startTransition(() => {
        (async () => {
          try {
            const fd = new FormData();
            fd.set("id", id);
            await deleteProduct(fd);
            toast.success("Producto borrado");
            if (editProduct?.id === id) setEditProduct(null);
            router.refresh();
          } catch (err) {
            toast.error("No se pudo borrar", {
              description: err instanceof Error ? err.message : "Error",
            });
          }
        })();
      });
    },
    [router, editProduct?.id]
  );

  const openEdit = React.useCallback((p: ProductRow) => {
    setOpenCreate(false);
    setEditProduct(p);
  }, []);

  const handleBarcodeKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const raw = barcodeSearchRef.current?.value ?? barcodeQuery;
      const found = findProductByScannedCode(products, raw);
      if (found) {
        openEdit(found);
        setBarcodeQuery("");
      } else {
        toast.error("No hay producto con ese código", {
          description: "Verificá el código o cargalo en el producto.",
        });
      }
    },
    [barcodeQuery, products, openEdit]
  );

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {hasActiveFilters
            ? `Mostrando ${filtered.length} de ${products.length} productos`
            : `${products.length} productos`}
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditProduct(null);
            setOpenCreate(true);
          }}
          className="h-10 rounded-2xl"
        >
          <Plus className="size-4" />
          Nuevo producto
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="product-search-name" className="text-xs text-muted-foreground">
            Buscar por nombre
          </Label>
          <Input
            id="product-search-name"
            type="search"
            placeholder="Ej: oreo, leche…"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            className="h-10 rounded-xl"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="product-search-barcode" className="text-xs text-muted-foreground">
            Código de barras
          </Label>
          <div className="relative">
            <ScanBarcode className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={barcodeSearchRef}
              id="product-search-barcode"
              type="text"
              inputMode="numeric"
              placeholder="Filtrar o escanear y Enter"
              value={barcodeQuery}
              onChange={(e) => setBarcodeQuery(e.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              className="h-10 rounded-xl pl-9"
              autoComplete="off"
            />
          </div>
          <p className="hidden text-[11px] text-muted-foreground lg:block">
            Enfocá este campo y escaneá: al terminar (Enter) se abre la edición.
          </p>
        </div>
      </div>

      {isMobileAssist ? (
        <div className="mt-3 lg:hidden">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full gap-2 rounded-xl border-emerald-600/40 bg-[var(--pos-surface)] font-semibold"
            onClick={() => setScannerSearchOpen(true)}
          >
            <ScanLine className="size-5" />
            Escanear para buscar y editar
          </Button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Lee el código de un producto ya cargado y se abre el formulario para ajustar stock y precios.
          </p>
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl border bg-card">
        <div className="overflow-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-[var(--pos-surface-2)] text-muted-foreground">
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium">Producto</th>
                <th className="px-4 py-3 text-left font-medium">Stock</th>
                <th className="px-4 py-3 text-left font-medium">Precio</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    {products.length === 0
                      ? "No hay productos cargados."
                      : "Ningún producto coincide con la búsqueda."}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {[p.barcode ? `EAN: ${p.barcode}` : null, p.expires_at ? `Vence: ${p.expires_at}` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatStock(p)}</td>
                    <td className="px-4 py-3 font-numeric">${p.price}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-lg border px-2 py-1 text-[11px] font-medium",
                          p.active
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-[var(--pos-border)] bg-[var(--pos-surface-2)] text-muted-foreground"
                        )}
                      >
                        {p.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 gap-2 rounded-xl border-[var(--pos-border)] bg-[var(--pos-surface)] text-xs hover:bg-[var(--pos-surface-2)]"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="size-3.5" />
                          Editar
                        </Button>
                        <Button type="button" variant="outline" size="icon" onClick={() => onDelete(p.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {openCreate ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setOpenCreate(false);
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-create-title"
          >
            <motion.div
              className="w-full max-w-3xl rounded-2xl border border-[var(--pos-border)] bg-card shadow-xl"
              initial={{ y: 16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <div id="modal-create-title" className="text-sm font-semibold tracking-tight">
                    Nuevo producto
                  </div>
                  <div className="text-xs text-muted-foreground">Cargá datos, precio y stock.</div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setOpenCreate(false)}>
                  <X className="size-4" />
                </Button>
              </div>

              <div className="p-5">
                <div className={cn(pending ? "pointer-events-none opacity-80" : "")}>
                  <ProductForm
                    title=""
                    description={undefined}
                    container={false}
                    action={onCreate}
                    canEditPrice={canEditPrice}
                    canEditStock={canEditStock}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {editProduct ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setEditProduct(null);
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-edit-title"
          >
            <motion.div
              className="max-h-[min(90vh,920px)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--pos-border)] bg-card shadow-xl"
              initial={{ y: 16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <div id="modal-edit-title" className="text-sm font-semibold tracking-tight">
                    Editar producto
                  </div>
                  <div className="text-xs text-muted-foreground">Actualizá precios, stock y código.</div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setEditProduct(null)}>
                  <X className="size-4" />
                </Button>
              </div>

              <div className="p-5">
                <div className={cn(pending ? "pointer-events-none opacity-80" : "")}>
                  <ProductForm
                    key={editProduct.id}
                    title={editProduct.name}
                    description="El precio de venta se recalcula en base a costo y margen."
                    container={false}
                    defaults={{
                      id: editProduct.id,
                      name: editProduct.name,
                      barcode: editProduct.barcode,
                      scale_code: editProduct.scale_code,
                      category: editProduct.category,
                      cost: Number(editProduct.cost),
                      price: Number(editProduct.price),
                      expires_at: editProduct.expires_at,
                      sold_by_weight: editProduct.sold_by_weight,
                      stock: Number(editProduct.stock),
                      stock_decimal: Number(editProduct.stock_decimal),
                      low_stock_threshold: Number(editProduct.low_stock_threshold),
                      low_stock_threshold_decimal: Number(editProduct.low_stock_threshold_decimal),
                      active: editProduct.active,
                    }}
                    action={onUpdate}
                    canEditPrice={canEditPrice}
                    canEditStock={canEditStock}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <BarcodeScanner
        open={scannerSearchOpen}
        continuous={false}
        steppedAfterSuccess={false}
        onClose={() => setScannerSearchOpen(false)}
        onDecoded={(raw) => {
          const code = raw.replace(/\s+/g, "").trim();
          if (!code) return false;
          const found = findProductByScannedCode(products, code);
          if (found) {
            openEdit(found);
            setBarcodeQuery("");
            toast.success("Producto encontrado", { description: found.name, duration: 1200 });
            return true;
          }
          toast.error("No hay producto con ese código", {
            description: "Creá uno nuevo con «Nuevo producto» o revisá el código.",
          });
          return false;
        }}
      />
    </div>
  );
}
