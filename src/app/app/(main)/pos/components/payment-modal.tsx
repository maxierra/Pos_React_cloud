"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import QRCode from "react-qr-code";

import { Landmark, X } from "lucide-react";

import { previewPromotion } from "@/app/app/(main)/pos/actions";
import { createMercadoPagoPosQr } from "@/app/app/(main)/pos/mp-qr-actions";
import {
  cancelMercadoPagoPosCheckout,
  getMercadoPagoPosCheckoutStatus,
} from "@/app/app/(main)/pos/mp-pending-actions";
import { PaymentMethodGlyph } from "@/app/app/(main)/pos/components/payment-method-glyph";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildPaymentLabelMap,
  methodButtonClass,
  sortPaymentMethods,
  type BusinessPaymentMethodRow,
  type PosPaymentMethodCode,
} from "@/lib/business-payment-methods";
import { cn } from "@/lib/utils";

type PaymentMethod = PosPaymentMethodCode;
type PaymentMethodOrMixed = PaymentMethod | "mixed";

type TicketPreviewItem = {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
};

type TicketBusinessInfo = {
  name: string;
  address: string | null;
  phone: string | null;
  cuit: string | null;
  ticket_header: string | null;
  ticket_footer: string | null;
} | null;

type PosCustomerOption = {
  id: string;
  name: string;
  credit_limit: number;
  balance: number;
  /** Límite − deuda: cuánto puede sumar esta venta sin superar el límite. */
  available_to_spend: number;
};

type Props = {
  open: boolean;
  total: number;
  items: TicketPreviewItem[];
  business: TicketBusinessInfo;
  pending: boolean;
  defaultMethod?: PaymentMethod;
  /** Todos los medios configurados (activos e inactivos); el modal usa los activos. */
  paymentMethodConfig: BusinessPaymentMethodRow[];
  /** Clientes del negocio (para venta en cuenta corriente). */
  customers?: PosCustomerOption[];
  /** Token + ID de caja configurados (RPC); si es false, no se pide QR a MP. */
  mercadoPagoQrReady?: boolean;
  onClose: () => void;
  onConfirm: (p: {
    payment_method: PaymentMethodOrMixed;
    payment_details?: {
      split: Array<{ method: PaymentMethod; amount: number }>;
    };
    cash_received?: number;
    print_ticket?: boolean;
    customer_id?: string | null;
  }) => void;
  /** Cuando MP confirma el pago por webhook y el servidor ya registró la venta. */
  onMercadoPagoAutoPaid?: (p: { saleId: string; printTicket: boolean }) => void;
};

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function formatMoneyAr(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(n);
}

function parseMoneyLoose(input: string) {
  const normalized = input.replace(",", ".").replace(/[^0-9.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function payloadInvolvesTransfer(p: {
  payment_method: PaymentMethodOrMixed;
  payment_details?: { split: Array<{ method: PaymentMethod; amount: number }> };
}): boolean {
  if (p.payment_method === "transfer") return true;
  if (p.payment_method === "mixed" && p.payment_details?.split) {
    return p.payment_details.split.some((s) => s.method === "transfer" && s.amount > 0);
  }
  return false;
}

function mercadopagoAmountInPayload(
  p: {
    payment_method: PaymentMethodOrMixed;
    payment_details?: { split: Array<{ method: PaymentMethod; amount: number }> };
  },
  saleTotal: number
): number {
  if (p.payment_method === "mercadopago") {
    return round2(saleTotal);
  }
  if (p.payment_method === "mixed" && p.payment_details?.split) {
    const sum = p.payment_details.split
      .filter((s) => s.method === "mercadopago")
      .reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
    return round2(sum);
  }
  return 0;
}

export function PaymentModal({
  open,
  total,
  items,
  business,
  pending,
  defaultMethod = "cash",
  paymentMethodConfig,
  customers = [],
  mercadoPagoQrReady = false,
  onClose,
  onConfirm,
  onMercadoPagoAutoPaid,
}: Props) {
  const activeSorted = React.useMemo(
    () => sortPaymentMethods(paymentMethodConfig.filter((m) => m.is_active)),
    [paymentMethodConfig]
  );
  const activeSortedNonCC = React.useMemo(
    () => activeSorted.filter((m) => m.method_code !== "cuenta_corriente"),
    [activeSorted]
  );
  const labelMap = React.useMemo(() => buildPaymentLabelMap(paymentMethodConfig), [paymentMethodConfig]);

  const resolveLabel = React.useCallback(
    (m: PaymentMethodOrMixed) => {
      if (m === "mixed") return "Mixto";
      return labelMap[m] ?? m;
    },
    [labelMap]
  );

  const rowFor = React.useCallback(
    (code: PaymentMethod) => paymentMethodConfig.find((x) => x.method_code === code),
    [paymentMethodConfig]
  );

  const initialSplitMethod = React.useMemo<PaymentMethod>(
    () => defaultMethod ?? (activeSorted[0]?.method_code as PaymentMethod) ?? "cash",
    [defaultMethod, activeSorted]
  );

  const [method, setMethod] = React.useState<PaymentMethod | null>(null);
  const [receivedInput, setReceivedInput] = React.useState<string>(String(total));
  const received = React.useMemo(() => parseMoneyLoose(receivedInput), [receivedInput]);
  const receivedRef = React.useRef<HTMLInputElement | null>(null);

  const [mixed, setMixed] = React.useState(false);
  const [m1, setM1] = React.useState<PaymentMethod>(initialSplitMethod);
  const [m2, setM2] = React.useState<PaymentMethod>("card");
  const [a1Input, setA1Input] = React.useState<string>(String(total));
  const a1 = React.useMemo(() => parseMoneyLoose(a1Input), [a1Input]);
  const a2 = React.useMemo(() => round2(Math.max(0, total - a1)), [total, a1]);

  const [cashReceivedInput, setCashReceivedInput] = React.useState<string>(String(total));
  const cashReceived = React.useMemo(() => parseMoneyLoose(cashReceivedInput), [cashReceivedInput]);
  const [printTicket, setPrintTicket] = React.useState(true);
  const [customerId, setCustomerId] = React.useState<string>("");
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [pendingPayload, setPendingPayload] = React.useState<{
    payment_method: PaymentMethodOrMixed;
    payment_details?: {
      split: Array<{ method: PaymentMethod; amount: number }>;
    };
    cash_received?: number;
  } | null>(null);
  const [transferConfirmOpen, setTransferConfirmOpen] = React.useState(false);
  const [mpQrLoading, setMpQrLoading] = React.useState(false);
  const [mpQrError, setMpQrError] = React.useState<string | null>(null);
  const [mpQrData, setMpQrData] = React.useState<string | null>(null);
  const [mpQrRetryTick, setMpQrRetryTick] = React.useState(0);
  const [mpExternalRef, setMpExternalRef] = React.useState<string | null>(null);
  const mpQrRequestRef = React.useRef(0);
  const mpAutoNotifiedRef = React.useRef(false);
  /** Evita resetear vista previa / QR cuando total o props del padre cambian mientras el modal sigue abierto (prod: refresh, RSC). */
  const paymentModalWasOpenRef = React.useRef(false);

  const abandonMercadoPagoPending = React.useCallback(async () => {
    if (mpExternalRef) {
      await cancelMercadoPagoPosCheckout(mpExternalRef);
      setMpExternalRef(null);
    }
  }, [mpExternalRef]);

  React.useEffect(() => {
    if (!open) {
      paymentModalWasOpenRef.current = false;
      return;
    }
    if (paymentModalWasOpenRef.current) {
      return;
    }
    paymentModalWasOpenRef.current = true;
    setMethod(null);
    setReceivedInput(String(total));
    setMixed(false);
    setM1(initialSplitMethod);
    setTransferConfirmOpen(false);
    setMpQrData(null);
    setMpQrError(null);
    setMpQrLoading(false);
    setMpQrRetryTick(0);
    setMpExternalRef(null);
    mpAutoNotifiedRef.current = false;
    const second =
      activeSorted.find((x) => x.method_code !== initialSplitMethod)?.method_code ??
      activeSorted.find((x) => x.method_code !== activeSorted[0]?.method_code)?.method_code ??
      initialSplitMethod;
    setM2(second);
    setA1Input(String(total));
    setCashReceivedInput(String(total));
    setPrintTicket(true);
    setCustomerId("");
    setPreviewOpen(false);
    setPendingPayload(null);
  }, [open, total, activeSorted, initialSplitMethod]);

  const effectivePaymentMethod: PaymentMethodOrMixed = mixed ? "mixed" : method ?? "cash";

  const [promoPreview, setPromoPreview] = React.useState<{
    name: string;
    percent: number;
    amount: number;
    total_before: number;
    total_after: number;
  } | null>(null);
  const [promoLoading, setPromoLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (!items.length) {
      setPromoPreview(null);
      return;
    }
    setPromoLoading(true);
    void (async () => {
      try {
        const res = await previewPromotion({
          payment_method: effectivePaymentMethod,
          items: items.map((it) => ({
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
        setPromoPreview(promo && promo.amount > 0 ? promo : null);
      } catch {
        setPromoPreview(null);
      } finally {
        setPromoLoading(false);
      }
    })();
  }, [open, items, effectivePaymentMethod]);

  const promo = promoPreview;
  const baseTotal = promo?.total_before ?? total;
  const finalTotal = promo?.total_after ?? total;

  React.useEffect(() => {
    if (!open) return;
    if (method === "cash") return;
    setReceivedInput(String(total));
  }, [method, open, total]);

  React.useEffect(() => {
    if (!open || mixed) return;
    if (method !== "cash") return;
    window.setTimeout(() => {
      receivedRef.current?.focus();
      receivedRef.current?.select();
    }, 0);
  }, [open, mixed, method]);

  React.useEffect(() => {
    if (!open) return;
    if (!mixed) return;
    const cashAmount = (m1 === "cash" ? a1 : 0) + (m2 === "cash" ? a2 : 0);
    setCashReceivedInput(String(cashAmount || total));
  }, [mixed, open, a1, a2, m1, m2, total]);

  React.useEffect(() => {
    if (!open || !mixed || activeSortedNonCC.length < 2) return;
    if (m2 !== m1) return;
    const other = activeSortedNonCC.find((x) => x.method_code !== m1)?.method_code;
    if (other) setM2(other as PaymentMethod);
  }, [open, mixed, m1, m2, activeSortedNonCC]);

  const mpCartFingerprint = React.useMemo(
    () =>
      `${total}|${items.map((it) => `${it.product_id}:${it.quantity}:${it.unit_price}`).join(",")}`,
    [items, total]
  );

  React.useEffect(() => {
    if (!open || !previewOpen || !pendingPayload) {
      return;
    }
    const amt = mercadopagoAmountInPayload(pendingPayload, total);
    if (!mercadoPagoQrReady || amt <= 0) {
      setMpQrLoading(false);
      setMpQrData(null);
      setMpQrError(null);
      return;
    }
    const rid = ++mpQrRequestRef.current;
    setMpQrLoading(true);
    setMpQrError(null);
    setMpQrData(null);
    const desc =
      items.length === 1
        ? String(items[0].name).slice(0, 150)
        : `Venta (${items.length} ítems)`;
    setMpExternalRef(null);
    void createMercadoPagoPosQr({
      amountArs: amt,
      description: desc,
      items: items.map((it) => ({
        product_id: it.product_id,
        name: it.name,
        quantity: it.quantity,
        unit_price: it.unit_price,
      })),
      payment_method: pendingPayload.payment_method,
      payment_details: {
        ...(pendingPayload.payment_details ?? {}),
        ...(pendingPayload.cash_received != null
          ? { cash_received: pendingPayload.cash_received }
          : {}),
      },
    }).then((res) => {
      if (rid !== mpQrRequestRef.current) return;
      setMpQrLoading(false);
      if (res && typeof res === "object" && "error" in res && res.error) {
        setMpQrError(String(res.error));
        return;
      }
      if (
        res &&
        typeof res === "object" &&
        "qr_data" in res &&
        typeof (res as { qr_data?: string }).qr_data === "string"
      ) {
        setMpQrData((res as { qr_data: string }).qr_data);
        const ext = (res as { external_reference?: string }).external_reference;
        if (typeof ext === "string" && ext.length > 0) {
          setMpExternalRef(ext);
        }
      }
    });
  }, [open, previewOpen, pendingPayload, mercadoPagoQrReady, total, mpCartFingerprint, mpQrRetryTick]);

  const change = React.useMemo(() => {
    if (!mixed) {
      if (method !== "cash") return 0;
      return round2(Math.max(0, received - total));
    }
    const cashAmount = (m1 === "cash" ? a1 : 0) + (m2 === "cash" ? a2 : 0);
    return round2(Math.max(0, cashReceived - cashAmount));
  }, [received, total, method, mixed, a1, a2, m1, m2, cashReceived]);

  const splitDiff = React.useMemo(() => {
    if (!mixed) return 0;
    return round2(a1 + a2 - total);
  }, [mixed, a1, a2, total]);

  const amountExceedsTotal = React.useMemo(() => {
    if (!mixed) return false;
    return a1 > total;
  }, [mixed, a1, total]);

  const mpAmountPreview = React.useMemo(() => {
    if (!pendingPayload) return 0;
    return mercadopagoAmountInPayload(pendingPayload, total);
  }, [pendingPayload, total]);

  React.useEffect(() => {
    if (!open || !previewOpen || !mpExternalRef || !mercadoPagoQrReady || mpAmountPreview <= 0) {
      return;
    }
    if (!onMercadoPagoAutoPaid) return;

    const tick = async () => {
      if (mpAutoNotifiedRef.current) return;
      const res = await getMercadoPagoPosCheckoutStatus(mpExternalRef);
      if (res && typeof res === "object" && "error" in res && res.error) return;
      if (res && "status" in res && res.status === "paid" && "saleId" in res && res.saleId) {
        mpAutoNotifiedRef.current = true;
        onMercadoPagoAutoPaid({ saleId: res.saleId, printTicket });
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), 2000);
    return () => window.clearInterval(id);
  }, [
    open,
    previewOpen,
    mpExternalRef,
    mercadoPagoQrReady,
    mpAmountPreview,
    onMercadoPagoAutoPaid,
    printTicket,
  ]);

  const mpQrFlowActive =
    mercadoPagoQrReady && mpAmountPreview > 0 && Boolean(mpQrData) && Boolean(mpExternalRef);

  const selectedCc = React.useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId]
  );

  const ccFirstScreenDisabled = React.useMemo(() => {
    if (method !== "cuenta_corriente" || mixed) return false;
    if (!customerId || customers.length === 0) return true;
    if (!selectedCc) return true;
    if (selectedCc.credit_limit <= 0) return true;
    if (round2(total) > selectedCc.available_to_spend + 0.009) return true;
    return false;
  }, [method, mixed, customerId, customers.length, selectedCc, total]);

  React.useEffect(() => {
    if (open) return;
    const ref = mpExternalRef;
    if (!ref) return;
    void cancelMercadoPagoPosCheckout(ref);
    setMpExternalRef(null);
  }, [open, mpExternalRef]);

  return (
    <>
      <AnimatePresence>
        {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="w-full max-w-lg rounded-2xl border bg-card shadow-xl"
            initial={{ y: 16, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <div className="text-sm font-semibold tracking-tight">Cobro</div>
                <div className="text-xs text-muted-foreground">Confirmá el pago</div>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={onClose}>
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex flex-col max-h-[85vh]">
              <div className="overflow-y-auto px-5 py-4">
                <div className="rounded-xl border bg-[var(--pos-surface-2)]/30 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total a cobrar</div>
                  <div className="mt-0.5 text-3xl font-bold tracking-tight text-[var(--pos-accent)]">
                    ${finalTotal.toFixed(2)}
                  </div>
                  {promo ? (
                    <div className="mt-1 space-y-0.5 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>${baseTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Promo: {promo.name} ({promo.percent.toFixed(1)}%)</span>
                        <span>−${promo.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : null}
                  {promoLoading ? (
                    <div className="mt-1 text-[10px] text-muted-foreground">Calculando promociones…</div>
                  ) : null}
                </div>

                <div className="mt-3 grid gap-2.5">
                  <div className="flex items-center justify-between rounded-xl border bg-background px-4 py-2.5">
                    <div>
                      <div className="text-sm font-medium">Pago mixto</div>
                      <div className="text-[11px] text-muted-foreground">Permite 2 medios con montos</div>
                    </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={mixed}
                    disabled={activeSortedNonCC.length < 2}
                    onClick={() => {
                      setMixed((v) => {
                        const next = !v;
                        if (next && activeSortedNonCC.length >= 2) {
                          setM1(activeSortedNonCC[0]!.method_code as PaymentMethod);
                          setM2(activeSortedNonCC[1]!.method_code as PaymentMethod);
                        }
                        return next;
                      });
                    }}
                    className={
                      "relative h-7 w-12 rounded-full border transition " +
                      (mixed
                        ? "border-[var(--pos-accent)] bg-[var(--pos-accent)]"
                        : "border-[var(--pos-border)] bg-[var(--pos-surface-2)]")
                    }
                  >
                    <span
                      className={
                        "absolute top-0.5 size-6 rounded-full bg-white transition " +
                        (mixed ? "left-[calc(100%-1.625rem)]" : "left-0.5")
                      }
                    />
                  </button>
                </div>

                {mixed ? (
                  <div className="grid gap-3 rounded-xl border bg-background p-4">
                    <div className="grid gap-2.5 md:grid-cols-2">
                      <div className="grid gap-1.5">
                        <Label htmlFor="m1" className="text-xs">Medio 1</Label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                            <PaymentMethodGlyph
                              iconKey={rowFor(m1)?.icon_key ?? "banknote"}
                              iconUrl={rowFor(m1)?.icon_url}
                              className="size-3.5"
                              imgClassName="size-3.5"
                            />
                          </div>
                          <select
                            id="m1"
                            value={m1}
                            onChange={(e) => setM1(e.target.value as PaymentMethod)}
                            className="h-10 w-full rounded-lg border border-input bg-transparent pl-9 pr-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                          >
                            {activeSortedNonCC.map((r) => (
                              <option key={r.method_code} value={r.method_code}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-1.5">
                        <Label htmlFor="a1" className="text-xs">Monto 1</Label>
                        <Input
                          id="a1"
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          value={a1Input}
                          onChange={(e) => setA1Input(e.target.value)}
                          className="h-10 text-base font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2.5 md:grid-cols-2">
                      <div className="grid gap-1.5">
                        <Label htmlFor="m2" className="text-xs">Medio 2</Label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                            <PaymentMethodGlyph
                              iconKey={rowFor(m2)?.icon_key ?? "banknote"}
                              iconUrl={rowFor(m2)?.icon_url}
                              className="size-3.5"
                              imgClassName="size-3.5"
                            />
                          </div>
                          <select
                            id="m2"
                            value={m2}
                            onChange={(e) => setM2(e.target.value as PaymentMethod)}
                            className="h-10 w-full rounded-lg border border-input bg-transparent pl-9 pr-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                          >
                            {activeSortedNonCC.map((r) => (
                              <option key={r.method_code} value={r.method_code}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-1.5">
                        <Label htmlFor="a2" className="text-xs">Monto 2</Label>
                        <Input
                          id="a2"
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          value={String(a2)}
                          readOnly
                          className="h-10 text-base font-semibold bg-muted/30"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="text-muted-foreground">Diferencia</div>
                      <div className={splitDiff === 0 ? "text-emerald-400" : "text-[var(--pos-amber)]"}>
                        {splitDiff === 0 ? "OK" : `${splitDiff > 0 ? "+" : ""}${splitDiff}`}
                      </div>
                    </div>

                    {amountExceedsTotal ? (
                      <div className="text-sm text-destructive">
                        El monto 1 no puede ser mayor al total.
                      </div>
                    ) : null}

                    {(m1 === "cash" && a1 > 0) || (m2 === "cash" && a2 > 0) ? (
                      <div className="grid gap-1.5">
                        <Label htmlFor="cash_received" className="text-xs font-semibold text-[color-mix(in_oklab,var(--pos-accent)_80%,black)]">Recibido en efectivo</Label>
                        <Input
                          id="cash_received"
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          value={cashReceivedInput}
                          onChange={(e) => setCashReceivedInput(e.target.value)}
                          className="h-10 text-base font-bold border-[var(--pos-accent)] shadow-[0_0_8px_var(--pos-glow)] focus-visible:ring-[var(--pos-glow)]"
                        />
                      </div>
                    ) : null}
                  </div>
                ) : (
                <div className="grid gap-2">
                  <Label htmlFor="received">Monto recibido</Label>
                  <Input
                    id="received"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    ref={receivedRef}
                    value={receivedInput}
                    onChange={(e) => setReceivedInput(e.target.value)}
                    className="h-12 text-lg"
                    disabled={method !== "cash"}
                  />
                </div>
                )}

                  <div className="flex items-center justify-between rounded-xl border bg-background px-4 py-2.5">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Vuelto</div>
                    <div className="text-2xl font-bold text-[var(--pos-amber)] tracking-tight">${change}</div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border bg-background px-4 py-2.5">
                    <div>
                      <div className="text-sm font-medium">Imprimir ticket</div>
                      <div className="text-[10px] text-muted-foreground">Vista previa antes de confirmar</div>
                    </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={printTicket}
                    onClick={() => setPrintTicket((v) => !v)}
                    className={
                      "relative h-7 w-12 rounded-full border transition " +
                      (printTicket
                        ? "border-[var(--pos-accent)] bg-[var(--pos-accent)]"
                        : "border-[var(--pos-border)] bg-[var(--pos-surface-2)]")
                    }
                  >
                    <span
                      className={
                        "absolute top-0.5 size-6 rounded-full bg-white transition " +
                        (printTicket ? "left-[calc(100%-1.625rem)]" : "left-0.5")
                      }
                    />
                  </button>
                </div>

                {!mixed && method === "cuenta_corriente" ? (
                  <div className="grid gap-2 rounded-xl border border-slate-500/30 bg-slate-500/5 p-4">
                    <Label htmlFor="pos-cc-customer" className="text-xs font-semibold">
                      Cliente (obligatorio)
                    </Label>
                    <select
                      id="pos-cc-customer"
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <option value="">Elegí un cliente</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {customers.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No hay clientes cargados. Creá uno en la sección Clientes.
                      </p>
                    ) : null}
                    {selectedCc ? (
                      <div className="mt-3 space-y-1.5 rounded-lg border border-slate-500/25 bg-background/90 p-3 text-xs">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">Límite de crédito</span>
                          <span className="tabular-nums font-medium">{formatMoneyAr(selectedCc.credit_limit)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">Deuda actual</span>
                          <span className="tabular-nums font-medium text-amber-600 dark:text-amber-400">
                            {formatMoneyAr(selectedCc.balance)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2 border-t border-slate-500/20 pt-2">
                          <span className="font-semibold text-foreground">Disponible para gastar</span>
                          <span
                            className={cn(
                              "tabular-nums font-bold",
                              selectedCc.available_to_spend <= 0.01
                                ? "text-destructive"
                                : "text-emerald-600 dark:text-emerald-400"
                            )}
                          >
                            {formatMoneyAr(selectedCc.available_to_spend)}
                          </span>
                        </div>
                        {selectedCc.credit_limit <= 0 ? (
                          <p className="text-[11px] leading-snug text-destructive">
                            Sin límite de crédito: asigná un límite en Clientes para poder vender en cuenta corriente.
                          </p>
                        ) : null}
                        {selectedCc.credit_limit > 0 && round2(total) > selectedCc.available_to_spend + 0.009 ? (
                          <p className="text-[11px] leading-snug text-destructive">
                            El total ({formatMoneyAr(total)}) supera lo disponible ({formatMoneyAr(selectedCc.available_to_spend)}
                            ). Reducí el carrito o cobrá parte de la deuda primero.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid gap-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Método rápido</div>
                  <div
                    className={cn(
                      "grid gap-2",
                      activeSorted.length >= 4
                        ? "grid-cols-2 sm:grid-cols-4"
                        : activeSorted.length === 3
                          ? "grid-cols-3"
                          : "grid-cols-2"
                    )}
                  >
                    {activeSorted.map((r) => (
                      <Button
                        key={r.method_code}
                        type="button"
                        variant="outline"
                        className={cn(methodButtonClass(r.method_code as PaymentMethod, method === r.method_code))}
                        onClick={() => setMethod(r.method_code as PaymentMethod)}
                      >
                        <PaymentMethodGlyph iconKey={r.icon_key} iconUrl={r.icon_url} />
                        <span className="line-clamp-2 text-center leading-tight">{r.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                </div>
              </div>

              <div className="border-t p-4 bg-muted/5 backdrop-blur-sm">
                <Button
                  type="button"
                  className="w-full h-12 text-base font-bold bg-[var(--pos-accent)] text-black hover:bg-[var(--pos-accent)]/80 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:scale-[0.98]"
                  disabled={
                    pending ||
                    (mixed ? splitDiff !== 0 || amountExceedsTotal : false) ||
                    (!mixed && !method) ||
                    (!mixed && method === "cuenta_corriente" && ccFirstScreenDisabled)
                  }
                  onClick={() => {
                    let nextPayload: {
                      payment_method: PaymentMethodOrMixed;
                      payment_details?: {
                        split: Array<{ method: PaymentMethod; amount: number }>;
                      };
                      cash_received?: number;
                    };
                    if (!mixed) {
                      if (!method) return;
                      nextPayload = {
                        payment_method: method,
                        cash_received: method === "cash" ? received : undefined,
                      };
                    } else {
                      nextPayload = {
                        payment_method: "mixed",
                        payment_details: {
                          split: [
                            { method: m1, amount: round2(a1) },
                            { method: m2, amount: round2(a2) },
                          ],
                        },
                        cash_received: (m1 === "cash" && a1 > 0) || (m2 === "cash" && a2 > 0) ? cashReceived : undefined,
                      };
                    }

                    setPendingPayload(nextPayload);
                    setPreviewOpen(true);
                  }}
                >
                  {pending ? "Procesando..." : "REVISAR Y COBRAR (ENTER)"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {open && previewOpen && pendingPayload ? (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setTransferConfirmOpen(false);
                void abandonMercadoPagoPending();
                setPreviewOpen(false);
              }
            }}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl border bg-card shadow-xl"
              initial={{ y: 14, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 14, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <div className="text-sm font-semibold tracking-tight">Vista previa del ticket</div>
                  <div className="text-xs text-muted-foreground">Confirmá si querés imprimir</div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setTransferConfirmOpen(false);
                    void abandonMercadoPagoPending();
                    setPreviewOpen(false);
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="p-5">
                <div className="max-h-[420px] overflow-auto rounded-xl border bg-background p-4 text-center font-mono text-xs">
                  <div className="font-bold">{business?.name ?? "Mi Negocio"}</div>
                  {business?.address ? <div>{business.address}</div> : null}
                  {business?.phone ? <div>Tel: {business.phone}</div> : null}
                  {business?.cuit ? <div>CUIT: {business.cuit}</div> : null}
                  {business?.ticket_header ? <div className="mt-1">{business.ticket_header}</div> : null}
                  <div className="my-2 border-b border-dashed" />
                  <div className="space-y-1 text-left">
                    {items.map((it) => {
                      const subtotal = round2(it.quantity * it.unit_price);
                      return (
                        <div key={it.product_id} className="flex items-center justify-between gap-2">
                          <div className="truncate">
                            {it.name} x{it.quantity}
                          </div>
                          <div>${subtotal.toFixed(2)}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="my-2 border-b border-dashed" />
                  {promo ? (
                    <>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Subtotal</span>
                        <span>${baseTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
                        <span>Promo: {promo.name} ({promo.percent.toFixed(1)}%)</span>
                        <span>−${promo.amount.toFixed(2)}</span>
                      </div>
                      <div className="my-1 border-b border-dashed" />
                    </>
                  ) : null}
                  <div className="flex items-center justify-between font-bold">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span>Pago</span>
                    <span>{resolveLabel(pendingPayload.payment_method)}</span>
                  </div>
                  {pendingPayload.payment_method === "cuenta_corriente" && customerId ? (
                    <>
                      <div className="mt-1 flex items-center justify-between text-left">
                        <span>Cliente</span>
                        <span className="max-w-[55%] truncate text-right font-medium">
                          {customers.find((c) => c.id === customerId)?.name ?? ""}
                        </span>
                      </div>
                      {selectedCc ? (
                        <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Disponible p/ esta venta</span>
                          <span
                            className={cn(
                              "tabular-nums font-semibold",
                              round2(total) > selectedCc.available_to_spend + 0.009
                                ? "text-destructive"
                                : "text-emerald-600 dark:text-emerald-400"
                            )}
                          >
                            {formatMoneyAr(selectedCc.available_to_spend)}
                          </span>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                  {pendingPayload.cash_received != null ? (
                    <div className="mt-1 flex items-center justify-between">
                      <span>Recibido</span>
                      <span>${pendingPayload.cash_received.toFixed(2)}</span>
                    </div>
                  ) : null}
                  {business?.ticket_footer ? <div className="mt-3 font-bold">{business.ticket_footer}</div> : null}
                </div>

                {mpAmountPreview > 0 ? (
                  <div className="mt-4 rounded-xl border border-sky-500/25 bg-sky-500/[0.07] p-4 dark:bg-sky-500/10">
                    <div className="text-center text-xs font-semibold uppercase tracking-wide text-sky-900 dark:text-sky-100">
                      {resolveLabel("mercadopago")}
                      {pendingPayload.payment_method === "mixed" ? (
                        <span className="mt-1 block font-normal normal-case text-muted-foreground">
                          Monto con este medio: ${mpAmountPreview.toFixed(2)}
                        </span>
                      ) : null}
                    </div>
                    {!mercadoPagoQrReady ? (
                      <p className="mt-2 text-center text-xs leading-relaxed text-muted-foreground">
                        Para mostrar el QR, configurá el access token y el ID de caja en{" "}
                        <Link
                          href="/app/settings"
                          className="font-medium text-sky-700 underline underline-offset-2 dark:text-sky-300"
                        >
                          Configuración → Mercado Pago (QR)
                        </Link>
                        .
                      </p>
                    ) : mpQrLoading ? (
                      <div className="mt-4 flex justify-center py-8 text-sm text-muted-foreground">
                        Generando código QR…
                      </div>
                    ) : mpQrError ? (
                      <div className="mt-4 space-y-3 text-center">
                        <p className="text-sm text-destructive">{mpQrError}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => setMpQrRetryTick((t) => t + 1)}
                        >
                          Reintentar QR
                        </Button>
                      </div>
                    ) : mpQrData ? (
                      <div className="mt-4 flex flex-col items-center gap-3">
                        <div className="rounded-xl bg-white p-3 shadow-md">
                          <QRCode value={mpQrData} size={196} />
                        </div>
                        <p className="max-w-xs text-center text-[11px] leading-snug text-muted-foreground">
                          Mostrá este código al cliente para que pague con Mercado Pago u otra app compatible.
                        </p>
                        {onMercadoPagoAutoPaid ? (
                          <p className="max-w-xs text-center text-[11px] font-medium leading-snug text-sky-900/90 dark:text-sky-100/90">
                            Cuando el pago se acredita, la venta se registra sola (notificación de Mercado Pago). No hace
                            falta tocar &quot;Confirmar&quot; salvo que quieras registrarla a mano.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-4 flex items-center justify-between rounded-xl border bg-background px-4 py-3">
                  <div className="text-sm">Imprimir al confirmar</div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={printTicket}
                    onClick={() => setPrintTicket((v) => !v)}
                    className={
                      "relative h-7 w-12 rounded-full border transition " +
                      (printTicket
                        ? "border-[var(--pos-accent)] bg-[var(--pos-accent)]"
                        : "border-[var(--pos-border)] bg-[var(--pos-surface-2)]")
                    }
                  >
                    <span
                      className={
                        "absolute top-0.5 size-6 rounded-full bg-white transition " +
                        (printTicket ? "left-[calc(100%-1.625rem)]" : "left-0.5")
                      }
                    />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setTransferConfirmOpen(false);
                      void abandonMercadoPagoPending();
                      setPreviewOpen(false);
                    }}
                    disabled={pending}
                  >
                    Volver
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (payloadInvolvesTransfer(pendingPayload)) {
                        setTransferConfirmOpen(true);
                        return;
                      }
                      void (async () => {
                        if (mpExternalRef) {
                          await cancelMercadoPagoPosCheckout(mpExternalRef);
                          setMpExternalRef(null);
                        }
                        onConfirm({
                          ...pendingPayload,
                          print_ticket: printTicket,
                          customer_id:
                            pendingPayload.payment_method === "cuenta_corriente" ? customerId || null : null,
                        });
                      })();
                    }}
                    disabled={pending || (pendingPayload.payment_method === "cuenta_corriente" && ccFirstScreenDisabled)}
                    variant={mpQrFlowActive ? "outline" : "default"}
                  >
                    {pending
                      ? "Procesando..."
                      : mpQrFlowActive
                        ? "Registrar sin esperar notificación"
                        : "Confirmar cobro"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {open && previewOpen && transferConfirmOpen && pendingPayload ? (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transfer-confirm-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setTransferConfirmOpen(false);
            }}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl border border-border/80 bg-card p-5 shadow-2xl"
              initial={{ y: 10, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
                  <Landmark className="size-5" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div id="transfer-confirm-title" className="font-semibold tracking-tight">
                    {resolveLabel("transfer")}
                  </div>
                  <p className="text-sm leading-snug text-muted-foreground">
                    Verificá en tu banco o app que el importe de{" "}
                    <span className="font-semibold text-foreground">${total.toFixed(2)}</span> ya ingresó. Recién
                    entonces registramos la venta.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={() => setTransferConfirmOpen(false)} disabled={pending}>
                  Revisar de nuevo
                </Button>
                <Button
                  type="button"
                  className="bg-violet-600 text-white hover:bg-violet-700"
                  disabled={pending}
                  onClick={() => {
                    void (async () => {
                      if (mpExternalRef) {
                        await cancelMercadoPagoPosCheckout(mpExternalRef);
                        setMpExternalRef(null);
                      }
                      onConfirm({
                        ...pendingPayload,
                        print_ticket: printTicket,
                        customer_id:
                          pendingPayload.payment_method === "cuenta_corriente" ? customerId || null : null,
                      });
                      setTransferConfirmOpen(false);
                    })();
                  }}
                >
                  {pending ? "Registrando…" : "Sí, ya ingresó"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
