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
import { useCart } from "@/app/app/(main)/pos/hooks/use-cart";
import { useProducts, type PosProduct } from "@/app/app/(main)/pos/hooks/use-products";
import { parseScaleBarcode } from "@/app/app/(main)/pos/utils/scale-barcode";
import { beep } from "@/app/app/(main)/pos/utils/beep";
import { buildPaymentLabelMap, sortPaymentMethods, type BusinessPaymentMethodRow } from "@/lib/business-payment-methods";
import { printTicket, type TicketItem } from "@/lib/ticket-utils";

export { type PosProduct } from "@/app/app/(main)/pos/hooks/use-products";

type PosBusinessInfo = {
  name: string;
  address: string | null;
  phone: string | null;
  cuit: string | null;
  ticket_header: string | null;
  ticket_footer: string | null;
} | null;

export function PosClient({
  products,
  business,
  cashOpen = false,
  paymentMethodConfig,
  mercadoPagoQrReady = false,
}: {
  products: PosProduct[];
  business: PosBusinessInfo;
  cashOpen?: boolean;
  paymentMethodConfig: BusinessPaymentMethodRow[];
  mercadoPagoQrReady?: boolean;
}) {
  const router = useRouter();
  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [paymentOpen, setPaymentOpen] = React.useState(false);

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
    (p: PosProduct) => {
      cart.add(p);
      beep();
      prod.setQuery("");
      toast.success("Agregado", { description: p.name, duration: 900 });
      
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

  const onSearchKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      e.preventDefault();

      const q = prod.query;
      const found = prod.findByBarcodeOrName(q);
      if (found) {
        addProduct(found);
        return;
      }

      const parsed = parseScaleBarcode(q.replace(/\s+/g, "").trim());
      if (parsed) {
        const byScaleCode = products.find((p) => (p.scale_code ?? "").toLowerCase() === parsed.scaleCode.toLowerCase());
        if (byScaleCode && byScaleCode.sold_by_weight) {
          cart.add(byScaleCode, { quantity: parsed.weightKg });
          beep();
          toast.success("Producto agregado", {
            description: `${byScaleCode.name} · ${parsed.weightKg} kg`,
          });
          prod.setQuery("");
          return;
        }
      }

      toast.error("No se encontró el producto");
    },
    [addProduct, prod, products, cart]
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
      payment_method: "cash" | "card" | "mercadopago" | "transfer" | "mixed";
      payment_details?: { split: Array<{ method: "cash" | "card" | "mercadopago" | "transfer"; amount: number }> };
      cash_received?: number;
      print_ticket?: boolean;
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
              items: cart.items.map((it) => ({
                product_id: it.product_id,
                name: it.name,
                quantity: it.quantity,
                unit_price: it.unit_price,
              })),
            });

            if (p.print_ticket) {
              printTicket({
                kind: "sale",
                business,
                items: cart.items,
                total: cart.total,
                saleId: res.saleId,
                paymentMethod: p.payment_method,
                paymentMethodLabels: paymentLabelMap,
                cashReceived: p.cash_received,
              });
            }

            cart.clear();
            closePayment();
            toast.success("Venta registrada", {
              description: `ID ${res.saleId.slice(0, 8)}`,
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
          <div className="w-full">
            <SearchBar inputRef={searchRef} value={prod.query} onChange={prod.setQuery} onKeyDown={onSearchKeyDown} />
          </div>
        }
        left={
          <div>
            <div className="mb-3 flex items-center justify-between">
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

      <PaymentModal
        open={paymentOpen}
        total={cart.total}
        items={cart.items}
        business={business}
        pending={pending}
        defaultMethod={defaultPaymentMethod}
        paymentMethodConfig={paymentMethodConfig}
        mercadoPagoQrReady={mercadoPagoQrReady}
        onClose={closePayment}
        onConfirm={onConfirmPayment}
        onMercadoPagoAutoPaid={onMercadoPagoAutoPaid}
      />
    </div>
  );
}
