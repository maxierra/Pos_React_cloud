"use client";

import * as React from "react";
import { CheckCircle2, Loader2, ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";

import { getStoreOrderStatus, startStoreCheckout } from "@/app/comprar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DESKTOP_PAID_DOWNLOAD_PATH } from "@/lib/desktop-download";
import { trackMetaCustomEvent, trackMetaEvent } from "@/components/analytics/meta-pixel";

const BUSINESS_TYPES = [
  { value: "retail", label: "Comercio" },
  { value: "fashion", label: "Indumentaria" },
  { value: "gastronomy", label: "Gastronomía" },
] as const;

export function PromoCountdown() {
  return <span>50% OFF durante agosto · Válida hasta el 31 de agosto</span>;
}

function readCookie(name: string) {
  const prefix = `${name}=`;
  const item = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : "";
}

type OrderState = {
  orderId: string;
  provisioned: boolean;
  status: string;
};

type SoftwarePurchaseModalProps = {
  listAmount: number;
  promoCode: string;
  discountPercent: number;
  promoAmount: number;
  triggerLabel?: string;
  triggerClassName?: string;
  primaryMarker?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SoftwarePurchaseModal({ listAmount, promoCode, discountPercent, promoAmount, triggerLabel, triggerClassName, primaryMarker = false, onOpenChange }: SoftwarePurchaseModalProps) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [checkoutStarted, setCheckoutStarted] = React.useState(false);
  const [orderState, setOrderState] = React.useState<OrderState | null>(null);
  const popupRef = React.useRef<Window | null>(null);
  const pollRef = React.useRef<number | null>(null);
  const formStartedRef = React.useRef(false);
  const [form, setForm] = React.useState({
    email: "",
    customerName: "",
    phone: "",
    businessName: "",
    businessType: "retail",
  });

  const updateOpen = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [onOpenChange]);

  const closeModal = React.useCallback(() => {
    if (pending) return;
    updateOpen(false);
    setCheckoutStarted(false);
    setOrderState(null);
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [pending, updateOpen]);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;
      const payload = event.data as { type?: string; orderId?: string };
      if (payload.type !== "store-order-paid" || !payload.orderId) return;
      const purchaseKey = `meta-purchase-${payload.orderId}`;
      if (!window.sessionStorage.getItem(purchaseKey)) {
        trackMetaEvent("Purchase", { value: promoAmount, currency: "ARS", content_name: "Tienda360 Software para Windows" }, payload.orderId);
        window.sessionStorage.setItem(purchaseKey, "1");
      }
      updateOpen(true);
      setCheckoutStarted(true);
      setOrderState((current) => ({
        orderId: payload.orderId!,
        provisioned: current?.provisioned ?? false,
        status: current?.status ?? "paid",
      }));
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [promoAmount, updateOpen]);

  React.useEffect(() => {
    if (!checkoutStarted || !orderState?.orderId) return;

    let cancelled = false;
    const poll = async () => {
      const res = await getStoreOrderStatus(orderState.orderId);
      if (cancelled || !res) return;
      setOrderState({
        orderId: orderState.orderId,
        provisioned: res.provisioned,
        status: res.status,
      });
      if (res.provisioned && popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      if (res.provisioned && pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    void poll();
    pollRef.current = window.setInterval(() => {
      void poll();
    }, 2500);

    return () => {
      cancelled = true;
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [checkoutStarted, orderState?.orderId]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    popupRef.current = window.open("", "tienda360_checkout", "popup=yes,width=980,height=820");

    startTransition(async () => {
      const res = await startStoreCheckout({
        sku: "software_lifetime",
        email: form.email,
        customerName: form.customerName,
        phone: form.phone,
        businessName: form.businessName,
        businessType: form.businessType,
        couponCode: promoCode,
        metaFbp: readCookie("_fbp"),
        metaFbc: readCookie("_fbc"),
      });

      if ("error" in res) {
        popupRef.current?.close();
        toast.error(res.error);
        return;
      }

      trackMetaCustomEvent("FormularioCompletado", { content_name: "Tienda360 Software para Windows" });
      trackMetaEvent("InitiateCheckout", { value: promoAmount, currency: "ARS", content_name: "Tienda360 Software para Windows" });
      updateOpen(true);
      setCheckoutStarted(true);
      setOrderState({ orderId: res.orderId, provisioned: false, status: "pending_payment" });

      if (!popupRef.current) {
        window.location.assign(res.checkoutUrl);
        return;
      }
      popupRef.current.location.href = res.checkoutUrl;
    });
  };

  return (
    <>
      <Button
        type="button"
        data-primary-purchase={primaryMarker ? "true" : undefined}
        onClick={() => {
          trackMetaCustomEvent("ClickComprar", { value: promoAmount, currency: "ARS", content_name: "Tienda360 Software para Windows" });
          updateOpen(true);
        }}
        className={triggerClassName ?? "inline-flex h-12 items-center justify-center rounded-full border border-[#0077c7] bg-[#009ee3] px-6 text-sm font-semibold text-white shadow-[0_12px_24px_-12px_rgba(0,158,227,0.85)] transition hover:bg-[#008ad4]"}
      >
        <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold">
          MP
        </span>
        {triggerLabel ?? "Pagar con Mercado Pago"}
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-[90] overflow-y-auto overscroll-contain bg-slate-950/55 backdrop-blur-sm sm:px-4 sm:py-6"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="relative mx-auto min-h-[100dvh] w-full bg-white px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 shadow-[0_30px_80px_-32px_rgba(15,23,42,0.45)] sm:min-h-0 sm:max-w-xl sm:rounded-[2rem] sm:border sm:border-white/80 sm:p-6">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>

            {checkoutStarted ? (
              <div className="space-y-4 pr-10">
                <h3 className="text-2xl font-bold tracking-tight text-slate-950">
                  {orderState?.provisioned ? "Pago acreditado" : "Pago en proceso"}
                </h3>
                <p className="text-sm leading-7 text-slate-600">
                  {orderState?.provisioned
                    ? "Tu pago fue confirmado. Ya podés descargar el software desde acá mismo."
                    : "Abrimos Mercado Pago en una ventana aparte. Cuando el pago se acredite, este modal te mostrará automáticamente la descarga."}
                </p>

                {!orderState?.provisioned ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-900">
                    <Loader2 className="size-4 animate-spin" />
                    Esperando confirmación de Mercado Pago
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <a
                      href={`${DESKTOP_PAID_DOWNLOAD_PATH}?order=${encodeURIComponent(orderState.orderId)}`}
                      className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-700 px-6 text-sm font-semibold text-white transition hover:bg-emerald-800"
                    >
                      Descargar software
                    </a>
                    <Button type="button" variant="outline" onClick={closeModal}>
                      Cerrar
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="pr-10">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">Pago único</p>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                    Comprá Tienda360 para Windows
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Completá tus datos, pagás en Mercado Pago en una ventana aparte y cuando el pago
                    se acredita te mostramos acá mismo el botón de descarga.
                  </p>
                </div>

                <form
                  onSubmit={submit}
                  onChange={() => {
                    if (formStartedRef.current) return;
                    formStartedRef.current = true;
                    trackMetaCustomEvent("FormularioIniciado", { content_name: "Tienda360 Software para Windows" });
                  }}
                  className="mt-6 grid gap-4"
                >
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-950">
                      <CheckCircle2 className="size-5" /> {discountPercent}% OFF aplicado automáticamente
                    </div>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <div className="text-xs text-slate-500">Antes <span className="line-through">${listAmount.toLocaleString("es-AR")}</span></div>
                      <div className="text-2xl font-black text-slate-950">${promoAmount.toLocaleString("es-AR")}</div>
                    </div>
                    <div
                      className="mt-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-center text-sm font-extrabold text-red-700 shadow-[0_10px_30px_-18px_rgba(220,38,38,.8)]"
                      aria-live="polite"
                    >
                      <PromoCountdown />
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="software-email" className="text-slate-800">Email</Label>
                    <Input
                      id="software-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="tu@email.com"
                      className="h-11 bg-white text-slate-950 placeholder:text-slate-400"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="software-customerName" className="text-slate-800">Nombre completo</Label>
                    <Input
                      id="software-customerName"
                      required
                      autoComplete="name"
                      placeholder="Nombre y apellido"
                      className="h-11 bg-white text-slate-950 placeholder:text-slate-400"
                      value={form.customerName}
                      onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="software-phone" className="text-slate-800">Teléfono / WhatsApp</Label>
                    <Input
                      id="software-phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="Ej.: 11 1234 5678"
                      className="h-11 bg-white text-slate-950 placeholder:text-slate-400"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="software-businessName" className="text-slate-800">Nombre del negocio</Label>
                    <Input
                      id="software-businessName"
                      required
                      autoComplete="organization"
                      placeholder="Ej.: Mi comercio"
                      className="h-11 bg-white text-slate-950 placeholder:text-slate-400"
                      value={form.businessName}
                      onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="software-businessType" className="text-slate-800">Tipo de negocio</Label>
                    <select
                      id="software-businessType"
                      className="flex h-11 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-slate-950"
                      value={form.businessType}
                      onChange={(e) => setForm((f) => ({ ...f, businessType: e.target.value }))}
                    >
                      {BUSINESS_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-white/95 px-4 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
                    <Button type="submit" disabled={pending} className="w-full">
                      {pending ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Preparando pago…
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 size-4" />
                          Pagar ${promoAmount.toLocaleString("es-AR")} con Mercado Pago
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
