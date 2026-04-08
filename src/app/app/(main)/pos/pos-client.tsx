"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { checkoutSale } from "@/app/app/(main)/pos/actions";
import { CartPanel } from "@/app/app/(main)/pos/components/CartPanel";
import { POSLayout } from "@/app/app/(main)/pos/components/POSLayout";
import { PaymentModal } from "@/app/app/(main)/pos/components/payment-modal";
import { ProductGrid } from "@/app/app/(main)/pos/components/product-grid";
import { SearchBar } from "@/app/app/(main)/pos/components/SearchBar";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useCart } from "@/app/app/(main)/pos/hooks/use-cart";
import { useProducts, type PosProduct } from "@/app/app/(main)/pos/hooks/use-products";
import { parseScaleBarcode } from "@/app/app/(main)/pos/utils/scale-barcode";
import { beep } from "@/app/app/(main)/pos/utils/beep";
import { buildPaymentLabelMap, sortPaymentMethods, type BusinessPaymentMethodRow } from "@/lib/business-payment-methods";
import { printTicket } from "@/lib/ticket-utils";
import { useIsMobilePos } from "@/hooks/use-is-mobile-pos";
import { Button } from "@/components/ui/button";
import { ScanLine } from "lucide-react";

export { type PosProduct } from "@/app/app/(main)/pos/hooks/use-products";

export type PosCustomerCredit = {
  id: string;
  name: string;
  /** Límite máximo de deuda permitido. */
  credit_limit: number;
  /** Deuda actual (compras CC − cobros). */
  balance: number;
  /** Saldo disponible para nuevas compras a cuenta: límite − deuda. */
  available_to_spend: number;
};

type PosBusinessInfo = {
  name: string;
  address: string | null;
  phone: string | null;
  cuit: string | null;
  ticket_header: string | null;
  ticket_footer: string | null;
} | null;

export type PosDecodeResult =
  | { ok: false }
  | { ok: true; addedName: string; productId: string; soldByWeight: boolean };

export function PosClient({
  products,
  business,
  cashOpen = false,
  paymentMethodConfig,
  posCustomers = [],
  mercadoPagoQrReady = false,
}: {
  products: PosProduct[];
  business: PosBusinessInfo;
  cashOpen?: boolean;
  paymentMethodConfig: BusinessPaymentMethodRow[];
  /** Lista para ventas en cuenta corriente (incluye límite y saldo disponible). */
  posCustomers?: PosCustomerCredit[];
  mercadoPagoQrReady?: boolean;
}) {
  const router = useRouter();
  const isMobilePos = useIsMobilePos();
  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [scannerOpen, setScannerOpen] = React.useState(false);

  const cart = useCart();
  const prod = useProducts(products);

  const activePaymentMethods = React.useMemo(
    () => sortPaymentMethods(paymentMethodConfig.filter((m) => m.is_active)),
    [paymentMethodConfig]
  );
  const paymentLabelMap = React.useMemo(() => buildPaymentLabelMap(paymentMethodConfig), [paymentMethodConfig]);
  const defaultPaymentMethod = activePaymentMethods[0]?.method_code ?? "cash";

  const hasMore = prod.visibleCount < prod.filteredCount;

  const addProduct = React.useCallback(
    (p: PosProduct, opts?: { silentToast?: boolean }) => {
      cart.add(p);
      beep();
      prod.setQuery("");
      if (!opts?.silentToast) {
        toast.success("Agregado", { description: p.name, duration: 900 });
      }

      if (p.sold_by_weight) {
        setTimeout(() => {
          const input = document.getElementById(`qty-input-${p.id}`) as HTMLInputElement;
          if (input) {
            input.focus();
            input.select();
          }
        }, 50);
      } else {
        searchRef.current?.focus();
      }
    },
    [cart, searchRef]
  );

  const procesarCodigo = React.useCallback(
    (raw: string, opts?: { silentToast?: boolean }): PosDecodeResult => {
      const q = raw.replace(/\s+/g, "").trim();
      if (!q) return { ok: false };

      const found = prod.findByBarcodeOrName(q);
      if (found) {
        addProduct(found, { silentToast: opts?.silentToast });
        if (typeof console !== "undefined") console.log("[POS] Código procesado:", q);
        return {
          ok: true,
          addedName: found.name,
          productId: found.id,
          soldByWeight: found.sold_by_weight,
        };
      }

      const parsed = parseScaleBarcode(q);
      if (parsed) {
        const byScaleCode = products.find((p) => (p.scale_code ?? "").toLowerCase() === parsed.scaleCode.toLowerCase());
        if (byScaleCode && byScaleCode.sold_by_weight) {
          cart.add(byScaleCode, { quantity: parsed.weightKg });
          beep();
          if (!opts?.silentToast) {
            toast.success("Producto agregado", {
              description: `${byScaleCode.name} · ${parsed.weightKg} kg`,
            });
          }
          prod.setQuery("");
          if (typeof console !== "undefined") console.log("[POS] Código procesado (balanza):", q);
          return {
            ok: true,
            addedName: `${byScaleCode.name} · ${parsed.weightKg} kg`,
            productId: byScaleCode.id,
            soldByWeight: true,
          };
        }
      }

      prod.setQuery(q);
      toast.error("No se encontró el producto");
      return { ok: false };
    },
    [addProduct, prod, products, cart]
  );

  const onSearchKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      void procesarCodigo(prod.query);
    },
    [procesarCodigo, prod.query]
  );

  const getCartQuantityForProduct = React.useCallback(
    (productId: string) => cart.items.find((i) => i.product_id === productId)?.quantity ?? 0,
    [cart.items]
  );

  const onAdjustCartQuantityFromScanner = React.useCallback(
    (productId: string, direction: "inc" | "dec") => {
      const item = cart.items.find((i) => i.product_id === productId);
      if (!item) return;
      if (direction === "inc") {
        cart.inc(item);
        beep();
        return;
      }
      if (item.sold_by_weight) {
        if (item.quantity <= 0.051) return;
      } else if (item.quantity <= 1) {
        return;
      }
      cart.dec(item);
    },
    [cart]
  );

  const openPayment = React.useCallback(() => {
    if (cart.items.length === 0) return;
    if (!cashOpen) {
      toast.error("Caja cerrada", {
        description: "Debés abrir un turno de caja para poder vender. Ve a la sección Caja.",
      });
      return;
    }
    if (activePaymentMethods.length === 0) {
      toast.error("Sin medios de pago activos", {
        description: "Activá al menos uno en Configuración → Medios de pago.",
      });
      return;
    }
    setPaymentOpen(true);
  }, [cart.items.length, cashOpen, activePaymentMethods.length]);

  const closePayment = React.useCallback(() => {
    setPaymentOpen(false);
  }, []);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "F4") {
        e.preventDefault();
        openPayment();
      }
      if (e.key === "Escape") {
        if (paymentOpen) {
          e.preventDefault();
          closePayment();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePayment, openPayment, paymentOpen]);

  React.useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const onConfirmPayment = React.useCallback(
    (p: {
      payment_method: "cash" | "card" | "mercadopago" | "transfer" | "cuenta_corriente" | "mixed";
      payment_details?: {
        split: Array<{ method: "cash" | "card" | "mercadopago" | "transfer" | "cuenta_corriente"; amount: number }>;
      };
      cash_received?: number;
      print_ticket?: boolean;
      customer_id?: string | null;
    }) => {
      if (cart.items.length === 0) return;

      startTransition(() => {
        (async () => {
          try {
            const paymentDetailsWithCash =
              p.cash_received != null
                ? {
                    ...(p.payment_details ?? {}),
                    cash_received: p.cash_received,
                  }
                : p.payment_details;

            const res = await checkoutSale({
              payment_method: p.payment_method,
              payment_details: paymentDetailsWithCash,
              cash_received: p.cash_received,
              customer_id: p.customer_id ?? null,
              items: cart.items.map((it) => ({
                product_id: it.product_id,
                name: it.name,
                quantity: it.quantity,
                unit_price: it.unit_price,
              })),
            });

            const promo = (res as any).promotion as
              | { name: string; percent: number; amount: number; total_before: number; total_after: number }
              | null
              | undefined;

            if (p.print_ticket) {
              printTicket({
                kind: "sale",
                business,
                items: cart.items,
                total: promo?.total_after ?? cart.total,
                saleId: res.saleId,
                paymentMethod: p.payment_method,
                paymentMethodLabels: paymentLabelMap,
                cashReceived: p.cash_received,
                promotion: promo ?? null,
              });
            }

            cart.clear();
            closePayment();
            toast.success("Venta registrada", {
              description: promo
                ? `ID ${res.saleId.slice(0, 8)} · Promo: ${promo.name} (-$${promo.amount.toFixed(2)})`
                : `ID ${res.saleId.slice(0, 8)}`,
            });
          } catch (err) {
            toast.error("No se pudo cobrar", {
              description: err instanceof Error ? err.message : "Error",
            });
          }
        })();
      });
    },
    [business, cart, closePayment, paymentLabelMap, startTransition]
  );

  const onMercadoPagoAutoPaid = React.useCallback(
    ({ saleId, printTicket: shouldPrint }: { saleId: string; printTicket: boolean }) => {
      if (cart.items.length === 0) return;
      if (shouldPrint) {
        printTicket({
          kind: "sale",
          business,
          items: cart.items,
          total: cart.total,
          saleId,
          paymentMethod: "mercadopago",
          paymentMethodLabels: paymentLabelMap,
          cashReceived: undefined,
        });
      }
      cart.clear();
      closePayment();
      toast.success("Pago acreditado — venta registrada", {
        description: `ID ${saleId.slice(0, 8)}`,
      });
      router.refresh();
    },
    [business, cart, closePayment, paymentLabelMap, router]
  );

  return (
    <div>
      {!cashOpen && (
        <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <span className="font-semibold">Caja cerrada:</span> Abrí un turno en la sección{" "}
          <a href="/app/cash" className="underline hover:text-amber-600">Caja</a> para poder vender.
        </div>
      )}
      <POSLayout
        header={
          <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-stretch lg:gap-3">
            <Button
              type="button"
              variant="outline"
              className="order-1 h-14 w-full shrink-0 gap-2 rounded-2xl border-[var(--pos-accent)]/40 bg-[var(--pos-surface-2)] text-base font-semibold hover:bg-[var(--pos-accent)]/10 lg:order-2 lg:h-12 lg:w-auto lg:min-w-[9rem] lg:rounded-xl"
              onClick={() => setScannerOpen(true)}
            >
              <ScanLine className="size-5" />
              Escanear
            </Button>
            <div className="order-2 min-w-0 flex-1 lg:order-1">
              <SearchBar inputRef={searchRef} value={prod.query} onChange={prod.setQuery} onKeyDown={onSearchKeyDown} />
            </div>
          </div>
        }
        left={
          <div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">Productos</div>
              <div className="text-xs text-muted-foreground">
                Mostrando {prod.visible.length} / {prod.filteredCount}
              </div>
            </div>
            <ProductGrid
              products={prod.visible}
              onAdd={addProduct}
              onLoadMore={prod.loadMore}
              hasMore={hasMore}
              lastAddedProductId={cart.lastAddedProductId}
              onConsumeLastAdded={cart.consumeLastAdded}
            />
          </div>
        }
        right={
          <CartPanel
            items={cart.items}
            total={cart.total}
            pending={pending}
            onInc={cart.inc}
            onDec={cart.dec}
            onSetQty={cart.setQty}
            onRemove={cart.remove}
            onOpenPayment={openPayment}
            onFocusScanner={() => searchRef.current?.focus()}
            lastAddedProductId={cart.lastAddedProductId}
          />
        }
      />

      <BarcodeScanner
        open={scannerOpen}
        continuous={isMobilePos}
        steppedAfterSuccess={isMobilePos}
        getCartQuantityForProduct={getCartQuantityForProduct}
        onAdjustCartQuantity={onAdjustCartQuantityFromScanner}
        onClose={() => setScannerOpen(false)}
        onDecoded={(code) => procesarCodigo(code, { silentToast: isMobilePos })}
      />

      <PaymentModal
        open={paymentOpen}
        total={cart.total}
        items={cart.items}
        business={business}
        pending={pending}
        defaultMethod={defaultPaymentMethod}
        paymentMethodConfig={paymentMethodConfig}
        customers={posCustomers}
        mercadoPagoQrReady={mercadoPagoQrReady}
        onClose={closePayment}
        onConfirm={onConfirmPayment}
        onMercadoPagoAutoPaid={onMercadoPagoAutoPaid}
      />
    </div>
  );
}
