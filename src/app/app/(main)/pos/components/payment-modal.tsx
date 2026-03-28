"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Banknote, CreditCard, Landmark, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PaymentMethod = "cash" | "card" | "mercadopago" | "transfer";
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

type Props = {
  open: boolean;
  total: number;
  items: TicketPreviewItem[];
  business: TicketBusinessInfo;
  pending: boolean;
  defaultMethod?: PaymentMethod;
  onClose: () => void;
  onConfirm: (p: {
    payment_method: PaymentMethodOrMixed;
    payment_details?: {
      split: Array<{ method: PaymentMethod; amount: number }>;
    };
    cash_received?: number;
    print_ticket?: boolean;
  }) => void;
};

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function parseMoneyLoose(input: string) {
  const normalized = input.replace(",", ".").replace(/[^0-9.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function methodToLabel(method: PaymentMethodOrMixed) {
  if (method === "cash") return "Efectivo";
  if (method === "card") return "Tarjeta";
  if (method === "transfer") return "Transferencia";
  if (method === "mercadopago") return "Mercado Pago";
  return "Mixto";
}

function MethodIcon({ method, className }: { method: PaymentMethod; className?: string }) {
  if (method === "cash") return <Banknote className={className} />;
  if (method === "card") return <CreditCard className={className} />;
  return <Landmark className={className} />;
}

export function PaymentModal({ open, total, items, business, pending, defaultMethod = "cash", onClose, onConfirm }: Props) {
  const [method, setMethod] = React.useState<PaymentMethod>(defaultMethod);
  const [receivedInput, setReceivedInput] = React.useState<string>(String(total));
  const received = React.useMemo(() => parseMoneyLoose(receivedInput), [receivedInput]);
  const receivedRef = React.useRef<HTMLInputElement | null>(null);

  const [mixed, setMixed] = React.useState(false);
  const [m1, setM1] = React.useState<PaymentMethod>(defaultMethod);
  const [m2, setM2] = React.useState<PaymentMethod>("card");
  const [a1Input, setA1Input] = React.useState<string>(String(total));
  const a1 = React.useMemo(() => parseMoneyLoose(a1Input), [a1Input]);
  const a2 = React.useMemo(() => round2(Math.max(0, total - a1)), [total, a1]);

  const [cashReceivedInput, setCashReceivedInput] = React.useState<string>(String(total));
  const cashReceived = React.useMemo(() => parseMoneyLoose(cashReceivedInput), [cashReceivedInput]);
  const [printTicket, setPrintTicket] = React.useState(true);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [pendingPayload, setPendingPayload] = React.useState<{
    payment_method: PaymentMethodOrMixed;
    payment_details?: {
      split: Array<{ method: PaymentMethod; amount: number }>;
    };
    cash_received?: number;
  } | null>(null);

  React.useEffect(() => {
    if (open) {
      setMethod(defaultMethod);
      setReceivedInput(String(total));
      setMixed(false);
      setM1(defaultMethod);
      setM2(defaultMethod === "cash" ? "card" : "cash");
      setA1Input(String(total));
      setCashReceivedInput(String(total));
      setPrintTicket(true);
      setPreviewOpen(false);
      setPendingPayload(null);
      window.setTimeout(() => receivedRef.current?.focus(), 0);
    }
  }, [open, defaultMethod, total]);

  React.useEffect(() => {
    if (!open) return;
    if (method === "cash") return;
    setReceivedInput(String(total));
  }, [method, open, total]);

  React.useEffect(() => {
    if (!open) return;
    if (!mixed) return;
    const cashAmount = (m1 === "cash" ? a1 : 0) + (m2 === "cash" ? a2 : 0);
    setCashReceivedInput(String(cashAmount || total));
  }, [mixed, open, a1, a2, m1, m2, total]);

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
                  <div className="mt-0.5 text-3xl font-bold tracking-tight text-[var(--pos-accent)]">${total}</div>
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
                    onClick={() => setMixed((v) => !v)}
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
                            <MethodIcon method={m1} className="size-3.5" />
                          </div>
                          <select
                            id="m1"
                            value={m1}
                            onChange={(e) => setM1(e.target.value as PaymentMethod)}
                            className="h-10 w-full rounded-lg border border-input bg-transparent pl-9 pr-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                          >
                            <option value="cash">Efectivo</option>
                            <option value="card">Tarjeta</option>
                            <option value="transfer">Transferencia</option>
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
                            <MethodIcon method={m2} className="size-3.5" />
                          </div>
                          <select
                            id="m2"
                            value={m2}
                            onChange={(e) => setM2(e.target.value as PaymentMethod)}
                            className="h-10 w-full rounded-lg border border-input bg-transparent pl-9 pr-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                          >
                            <option value="cash">Efectivo</option>
                            <option value="card">Tarjeta</option>
                            <option value="transfer">Transferencia</option>
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

                <div className="grid gap-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Método rápido</div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={method === "cash" ? "default" : "outline"}
                      className={
                        method === "cash"
                          ? "h-12 bg-[var(--pos-accent)] text-black hover:bg-[color-mix(in_oklab,var(--pos-accent)_90%,black)]"
                          : "h-12"
                      }
                      onClick={() => setMethod("cash")}
                    >
                      <Banknote className="size-4" />
                      Efectivo
                    </Button>
                    <Button
                      type="button"
                      variant={method === "card" ? "default" : "outline"}
                      className={
                        method === "card"
                          ? "h-12 bg-[var(--pos-amber)] text-black hover:bg-[color-mix(in_oklab,var(--pos-amber)_90%,black)]"
                          : "h-12"
                      }
                      onClick={() => setMethod("card")}
                    >
                      <CreditCard className="size-4" />
                      Tarjeta
                    </Button>
                    <Button
                      type="button"
                      variant={method === "transfer" ? "default" : "outline"}
                      className={
                        method === "transfer"
                          ? "h-12 bg-violet-400 text-black hover:bg-violet-400/90"
                          : "h-12"
                      }
                      onClick={() => setMethod("transfer")}
                    >
                      <Landmark className="size-4" />
                      Transferencia
                    </Button>
                  </div>
                </div>

                </div>
              </div>

              <div className="border-t p-4 bg-muted/5 backdrop-blur-sm">
                <Button
                  type="button"
                  className="w-full h-12 text-base font-bold bg-[var(--pos-accent)] text-black hover:bg-[var(--pos-accent)]/80 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:scale-[0.98]"
                  disabled={pending || (mixed ? splitDiff !== 0 || amountExceedsTotal : false)}
                  onClick={() => {
                    let nextPayload: {
                      payment_method: PaymentMethodOrMixed;
                      payment_details?: {
                        split: Array<{ method: PaymentMethod; amount: number }>;
                      };
                      cash_received?: number;
                    };
                    if (!mixed) {
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
              if (e.target === e.currentTarget) setPreviewOpen(false);
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
                <Button type="button" variant="ghost" size="icon" onClick={() => setPreviewOpen(false)}>
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
                  <div className="flex items-center justify-between font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span>Pago</span>
                    <span>{methodToLabel(pendingPayload.payment_method)}</span>
                  </div>
                  {pendingPayload.cash_received != null ? (
                    <div className="mt-1 flex items-center justify-between">
                      <span>Recibido</span>
                      <span>${pendingPayload.cash_received.toFixed(2)}</span>
                    </div>
                  ) : null}
                  {business?.ticket_footer ? <div className="mt-3 font-bold">{business.ticket_footer}</div> : null}
                </div>

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
                  <Button type="button" variant="outline" onClick={() => setPreviewOpen(false)} disabled={pending}>
                    Volver
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      onConfirm({ ...pendingPayload, print_ticket: printTicket });
                    }}
                    disabled={pending}
                  >
                    {pending ? "Procesando..." : "Confirmar cobro"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
