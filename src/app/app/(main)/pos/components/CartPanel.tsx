"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CreditCard, Minus, Plus, ScanLine, Trash2 } from "lucide-react";

import type { CartItem } from "@/app/app/(main)/pos/hooks/use-cart";
import { PaymentMethodGlyph } from "@/app/app/(main)/pos/components/payment-method-glyph";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BusinessPaymentMethodRow } from "@/lib/business-payment-methods";
import { cn } from "@/lib/utils";

type Props = {
  items: CartItem[];
  total: number;
  contextLabel?: string | null;
  pending: boolean;
  onInc: (item: CartItem) => void;
  onDec: (item: CartItem) => void;
  onSetQty: (lineId: string, qty: number) => void;
  onRemove: (lineId: string) => void;
  onOpenPayment: () => void;
  paymentMethods: BusinessPaymentMethodRow[];
  selectedPaymentMethod: string;
  onSelectPaymentMethod: (method: string) => void;
  onFocusScanner: () => void;
  lastAddedProductId?: string | null;
  guidePanelRef?: React.RefObject<HTMLDivElement | null>;
  guideCobrarRef?: React.RefObject<HTMLDivElement | null>;
};

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function round0(n: number) {
  return Math.round(n);
}

type WeightEntryMode = "weight" | "amount";

const PAYMENT_TONES = [
  { card: "from-emerald-50 via-white to-emerald-100/80 dark:from-[#102b2b] dark:via-[#14263a] dark:to-[#153348]", icon: "from-emerald-400 to-emerald-600 shadow-emerald-500/25", border: "border-emerald-400" },
  { card: "from-sky-50 via-white to-blue-100/90 dark:from-[#10233d] dark:via-[#14263a] dark:to-[#17345d]", icon: "from-sky-400 to-blue-600 shadow-blue-500/25", border: "border-sky-400" },
  { card: "from-violet-50 via-white to-violet-100/90 dark:from-[#241b45] dark:via-[#19243b] dark:to-[#342158]", icon: "from-violet-400 to-purple-600 shadow-violet-500/25", border: "border-violet-400" },
  { card: "from-cyan-50 via-white to-sky-100/90 dark:from-[#0d2b3a] dark:via-[#14263a] dark:to-[#16415b]", icon: "from-cyan-400 to-sky-600 shadow-cyan-500/25", border: "border-cyan-400" },
  { card: "from-fuchsia-50 via-white to-pink-100/90 dark:from-[#351b3c] dark:via-[#202139] dark:to-[#492442]", icon: "from-fuchsia-400 to-pink-600 shadow-pink-500/25", border: "border-fuchsia-400" },
];

export function CartPanel({
  items,
  total,
  contextLabel,
  pending,
  onInc,
  onDec,
  onSetQty,
  onRemove,
  onOpenPayment,
  paymentMethods,
  selectedPaymentMethod,
  onSelectPaymentMethod,
  onFocusScanner,
  lastAddedProductId,
  guidePanelRef,
  guideCobrarRef,
}: Props) {
  const [gramsDraftById, setGramsDraftById] = React.useState<Record<string, string>>({});
  const [amountDraftById, setAmountDraftById] = React.useState<Record<string, string>>({});
  const [entryModeById, setEntryModeById] = React.useState<Record<string, WeightEntryMode>>({});
  const selectedPayment = paymentMethods.find((method) => method.method_code === selectedPaymentMethod);
  const surchargePercent = selectedPaymentMethod === "card" ? Number(selectedPayment?.surcharge_percent ?? 0) : 0;
  const chargeTotal = round2(total + (total * surchargePercent) / 100);

  React.useEffect(() => {
    setGramsDraftById((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const it of items) {
        if (!it.sold_by_weight) continue;
        if (next[it.line_id] === undefined) {
          next[it.line_id] = String(round0(it.quantity * 1000));
          changed = true;
        }
      }
      for (const id of Object.keys(next)) {
        if (!items.some((x) => x.line_id === id && x.sold_by_weight)) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [items]);

  const commitGrams = React.useCallback(
    (lineId: string) => {
      const raw = gramsDraftById[lineId] ?? "";
      const grams = Number(String(raw).trim());
      if (!Number.isFinite(grams)) return;
      const kg = grams / 1000;
      onSetQty(lineId, kg);
    },
    [gramsDraftById, onSetQty]
  );

  const revertGrams = React.useCallback(
    (item: CartItem) => {
      setGramsDraftById((prev) => ({ ...prev, [item.line_id]: String(round0(item.quantity * 1000)) }));
    },
    []
  );

  const revertAmount = React.useCallback((item: CartItem) => {
    setAmountDraftById((prev) => ({
      ...prev,
      [item.line_id]: String(round2(item.quantity * item.unit_price)),
    }));
  }, []);

  const commitAmount = React.useCallback(
    (item: CartItem) => {
      const raw = amountDraftById[item.line_id] ?? "";
      if (!String(raw).trim()) {
        revertAmount(item);
        return;
      }
      const amount = Number(String(raw).replace(",", ".").trim());
      if (!Number.isFinite(amount) || item.unit_price <= 0) return;
      onSetQty(item.line_id, amount / item.unit_price);
    },
    [amountDraftById, onSetQty, revertAmount]
  );

  const toggleEntryMode = React.useCallback((item: CartItem) => {
    setEntryModeById((prev) => {
      const nextMode: WeightEntryMode = prev[item.line_id] === "amount" ? "weight" : "amount";
      if (nextMode === "amount") {
        setAmountDraftById((drafts) => ({
          ...drafts,
          [item.line_id]: drafts[item.line_id] ?? String(round2(item.quantity * item.unit_price)),
        }));
      } else {
        setGramsDraftById((drafts) => ({
          ...drafts,
          [item.line_id]: drafts[item.line_id] ?? String(round0(item.quantity * 1000)),
        }));
      }
      return { ...prev, [item.line_id]: nextMode };
    });
  }, []);

  return (
    <div ref={guidePanelRef} className="flex h-full flex-col group-data-[cart-expanded=true]/cart:lg:grid group-data-[cart-expanded=true]/cart:lg:grid-cols-[minmax(0,1fr)_520px] group-data-[cart-expanded=true]/cart:lg:grid-rows-[auto_minmax(0,1fr)]">
      {/* Header: Total centralizado y destacado */}
      <div className="relative shrink-0 overflow-hidden border-b border-emerald-400/30 bg-[radial-gradient(circle_at_50%_120%,rgba(57,255,20,0.18),transparent_48%),radial-gradient(circle_at_92%_0%,rgba(16,185,129,0.16),transparent_34%),linear-gradient(135deg,#101814_0%,#111c18_52%,#0b1210_100%)] px-3 py-3 text-white shadow-[inset_0_-1px_0_rgba(57,255,20,0.12)] lg:p-5 group-data-[cart-expanded=true]/cart:lg:col-start-2 group-data-[cart-expanded=true]/cart:lg:row-start-1">
        <div aria-hidden="true" className="pointer-events-none absolute -right-5 -top-8 size-24 rounded-full border border-[#39ff14]/25 shadow-[0_0_30px_rgba(57,255,20,0.12)]" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-12 -left-8 size-28 rounded-full border-[18px] border-emerald-400/10" />
        <div className="text-center">
          <div className="relative text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300 lg:text-[11px]">
            Total a cobrar
          </div>
          {contextLabel ? <div className="mt-1 text-xs font-medium text-muted-foreground">{contextLabel}</div> : null}
          <div className="relative font-numeric text-3xl font-black tracking-tight text-[#57ff35] drop-shadow-[0_0_10px_rgba(57,255,20,0.65)] lg:text-5xl lg:drop-shadow-[0_0_18px_rgba(57,255,20,0.62)]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={`${selectedPaymentMethod}-${chargeTotal}`}
                initial={{ y: 10, opacity: 0, filter: "blur(4px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: -10, opacity: 0, filter: "blur(4px)" }}
                transition={{ duration: 0.18 }}
                className="inline-block"
              >
                ${chargeTotal}
              </motion.span>
            </AnimatePresence>
          </div>
          {surchargePercent > 0 ? (
            <div className="mt-1 flex items-center justify-center gap-2 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              <span>Subtotal ${total}</span>
              <span aria-hidden="true">·</span>
              <span>Recargo tarjeta ({surchargePercent}%): +${round2(chargeTotal - total)}</span>
            </div>
          ) : null}
          <div className="relative mt-0.5 text-[9px] font-medium text-slate-300 lg:mt-1 lg:text-xs">{items.length} {items.length === 1 ? "producto" : "productos"}</div>
        </div>
      </div>

      {/* Lista de items */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-2 lg:p-3 lg:pr-4 group-data-[cart-expanded=true]/cart:lg:col-start-1 group-data-[cart-expanded=true]/cart:lg:row-span-2 group-data-[cart-expanded=true]/cart:lg:row-start-1 group-data-[cart-expanded=true]/cart:lg:border-r group-data-[cart-expanded=true]/cart:lg:border-[var(--pos-border)] group-data-[cart-expanded=true]/cart:lg:p-5">
        {items.length === 0 ? (
          <div className="flex h-full min-h-24 flex-col items-center justify-center gap-1.5 p-3 text-center lg:min-h-0 lg:gap-3 lg:p-6">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 lg:size-16 lg:rounded-2xl lg:bg-emerald-500/10 lg:text-emerald-600 dark:text-blue-300 dark:lg:text-emerald-400">
              <ScanLine className="size-5 lg:size-8" strokeWidth={1.75} />
            </div>
            <div className="text-xs font-bold tracking-tight lg:text-base lg:font-semibold">Tu carrito está vacío</div>
            <div className="max-w-xs text-[10px] leading-snug text-muted-foreground lg:text-xs lg:leading-relaxed">
              <span className="block lg:hidden">
                Tocá <strong>Escanear</strong>: leés un código, te mostramos el producto y elegís si seguís
                escaneando o cerrás el lector. Más unidades del mismo ítem: botón{" "}
                <strong className="text-foreground">+</strong> en la línea.
              </span>
              <span className="hidden lg:block">Escaneá un código o tocá un producto en la lista.</span>
            </div>
          </div>
        ) : (
          <div className="grid gap-1.5 lg:gap-2">
            {items.map((item) => {
              const highlight = lastAddedProductId === item.line_id;
              const lineTotal = round2(item.quantity * item.unit_price);
              const entryMode = entryModeById[item.line_id] ?? "weight";
              const isAmountMode = item.sold_by_weight && entryMode === "amount";
              return (
                <div
                  key={item.line_id}
                  className={cn(
                    "grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-xl border border-[var(--pos-border)] bg-[var(--pos-surface-2)] px-2.5 py-2 transition-shadow lg:grid-cols-[minmax(0,1fr)_auto_84px_36px] lg:gap-3 lg:px-4 lg:py-3 group-data-[cart-expanded=true]/cart:lg:grid-cols-[minmax(220px,1fr)_auto_100px_36px]",
                    highlight
                      ? "border-emerald-300 shadow-md shadow-emerald-100 dark:border-emerald-700 dark:shadow-emerald-900/30"
                      : ""
                  )}
                >
                  <div className="min-w-0">
                    <div className="line-clamp-2 text-xs font-bold leading-snug lg:text-sm">{item.name}</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      ${item.unit_price}{item.sold_by_weight ? "/kg" : " c/u"}
                    </div>
                  </div>

                  <div className="col-span-3 flex flex-wrap items-center gap-2 lg:col-span-1 lg:flex-nowrap lg:justify-center">
                    {item.sold_by_weight ? (
                      <button
                        type="button"
                        onClick={() => toggleEntryMode(item)}
                        className={cn(
                          "rounded-full border px-2 py-1 text-[10px] font-semibold transition",
                          isAmountMode
                            ? "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        )}
                      >
                        {isAmountMode ? "Importe" : "Peso"}
                      </button>
                    ) : null}
                    <div className="flex items-center gap-1.5" aria-label={`Cantidad de ${item.name}`}>
                    <button
                      type="button"
                      aria-label="Quitar una unidad"
                      title="Quitar una unidad"
                      onClick={() => onDec(item)}
                      className="flex size-9 shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/40 lg:size-8"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <div className="relative">
                      <Input
                        id={`qty-input-${item.line_id}`}
                        value={
                          item.sold_by_weight
                            ? isAmountMode
                              ? (amountDraftById[item.line_id] || String(round2(item.quantity * item.unit_price)))
                              : (gramsDraftById[item.line_id] || String(round0(item.quantity * 1000)))
                            : item.quantity
                        }
                        onChange={(e) => {
                          if (!item.sold_by_weight) {
                            onSetQty(item.line_id, Number(e.target.value) || 0);
                            return;
                          }
                          if (isAmountMode) {
                            setAmountDraftById((prev) => ({ ...prev, [item.line_id]: e.target.value }));
                            return;
                          }
                          setGramsDraftById((prev) => ({ ...prev, [item.line_id]: e.target.value }));
                        }}
                        onBlur={() => {
                          if (!item.sold_by_weight) return;
                          if (isAmountMode) {
                            commitAmount(item);
                            return;
                          }
                          commitGrams(item.line_id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (item.sold_by_weight) {
                              if (isAmountMode) {
                                commitAmount(item);
                              } else {
                                commitGrams(item.line_id);
                              }
                            }
                            (e.currentTarget as HTMLInputElement).blur();
                            onFocusScanner();
                            return;
                          }
                          if (e.key === "Escape") {
                            e.preventDefault();
                            if (item.sold_by_weight) {
                              if (isAmountMode) {
                                revertAmount(item);
                              } else {
                                revertGrams(item);
                              }
                            }
                            (e.currentTarget as HTMLInputElement).blur();
                            onFocusScanner();
                          }
                        }}
                        type="number"
                        data-pos-weight-input={item.sold_by_weight ? "true" : undefined}
                        step={item.sold_by_weight ? (isAmountMode ? 1 : 10) : 1}
                        inputMode={item.sold_by_weight ? "decimal" : "numeric"}
                        className={cn(
                          "h-8 rounded-md bg-[var(--pos-surface)] text-center text-xs font-medium",
                          "border border-[var(--pos-border)]",
                          item.sold_by_weight ? "w-28 pr-7" : "w-20"
                        )}
                      />
                      {item.sold_by_weight ? (
                        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] font-medium text-muted-foreground">
                          {isAmountMode ? "$" : "g"}
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      aria-label="Agregar una unidad del mismo producto"
                      title="Agregar una unidad"
                      onClick={() => onInc(item)}
                      className="flex size-9 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-900/40 lg:size-8"
                    >
                      <Plus className="size-4" strokeWidth={2.5} />
                    </button>
                    </div>
                  </div>

                  <div className="row-start-1 text-right lg:row-auto">
                    <div className="hidden text-[9px] font-bold uppercase tracking-wider text-muted-foreground lg:block">Subtotal</div>
                    <div className="whitespace-nowrap text-sm font-extrabold text-emerald-600 dark:text-emerald-400 lg:mt-0.5">${lineTotal}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(item.line_id)}
                    aria-label={`Eliminar ${item.name} del carrito`}
                    title="Eliminar del carrito"
                    className="row-start-1 flex size-8 shrink-0 items-center justify-center justify-self-end rounded-lg border border-red-200 bg-red-50 text-red-500 transition-colors hover:bg-red-100 hover:text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/40 lg:row-auto"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer: medio seleccionado + botón Cobrar */}
      <div className="shrink-0 space-y-2 border-t border-[var(--pos-border)] p-2 lg:space-y-3 lg:p-4 group-data-[cart-expanded=true]/cart:lg:col-start-2 group-data-[cart-expanded=true]/cart:lg:row-start-2 group-data-[cart-expanded=true]/cart:lg:overflow-y-auto">
        <div>
          <div className="mb-1.5 flex items-center justify-between lg:mb-3">
            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700 lg:text-sm lg:normal-case lg:tracking-normal dark:text-slate-200">
              <span className="hidden size-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm lg:flex"><CreditCard className="size-4" /></span>
              Medios de pago
            </span>
            <span className="hidden text-[11px] text-muted-foreground lg:inline">Elegí la forma de cobro</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 lg:grid lg:grid-cols-3 lg:gap-2 lg:overflow-visible">
            {paymentMethods.map((method, methodIndex) => {
              const selected = selectedPaymentMethod === method.method_code;
              const percent = method.method_code === "card" ? Number(method.surcharge_percent ?? 0) : 0;
              const tone = PAYMENT_TONES[methodIndex % PAYMENT_TONES.length];
              return (
                <button
                  key={method.method_code}
                  type="button"
                  onClick={() => onSelectPaymentMethod(method.method_code)}
                  aria-pressed={selected}
                  className={cn(
                    "group relative flex min-h-11 min-w-[7rem] items-center gap-2 overflow-hidden rounded-xl border bg-gradient-to-br px-2 py-1.5 text-left shadow-sm transition-all duration-200 lg:min-h-[5.25rem] lg:min-w-0 lg:gap-2.5 lg:rounded-2xl lg:px-3 lg:py-2.5",
                    tone.card,
                    selected ? cn(tone.border, "-translate-y-1 scale-[1.02] text-slate-900 shadow-[0_0_22px_rgba(57,255,20,.72)] ring-2 ring-[#57ff35] dark:text-white") : "border-slate-200/80 text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-blue-300/20 dark:text-slate-200 dark:hover:border-blue-300/40"
                  )}
                >
                  <span aria-hidden="true" className="absolute -bottom-8 -right-5 h-14 w-24 rotate-[-12deg] rounded-[50%] bg-white/45 dark:bg-white/[0.05]" />
                  <kbd className="absolute left-1.5 top-1.5 z-10 flex size-5 items-center justify-center rounded-md border border-white/70 bg-slate-950/75 font-mono text-[10px] font-black text-white shadow-sm">
                    {methodIndex + 1}
                  </kbd>
                  {selected ? <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm lg:size-5"><Check className="size-3" strokeWidth={3} /></span> : null}
                  <span className={cn("relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-lg lg:size-11 lg:rounded-xl", tone.icon)}>
                    <PaymentMethodGlyph iconKey={method.icon_key} iconUrl={method.icon_url} className="size-4 lg:size-5" imgClassName="size-4 brightness-0 invert lg:size-5" />
                  </span>
                  <span className="relative min-w-0">
                    <span className="block text-[11px] font-extrabold leading-tight text-current lg:text-xs">{method.label}</span>
                    {percent > 0 ? (
                      <span className="hidden w-fit rounded-md bg-orange-100 px-1.5 py-0.5 text-[9px] font-extrabold text-orange-600 lg:block dark:bg-orange-500/15 dark:text-orange-300">+{percent}% recargo</span>
                    ) : (
                      <span className="hidden text-[10px] opacity-70 lg:block">Sin recargo</span>
                    )}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => onSelectPaymentMethod("mixed")}
              aria-pressed={selectedPaymentMethod === "mixed"}
              className={cn(
                "group relative flex min-h-11 min-w-[7rem] items-center gap-2 overflow-hidden rounded-xl border bg-gradient-to-br from-orange-50 via-white to-amber-100/90 px-2 py-1.5 text-left shadow-sm transition-all duration-200 lg:min-h-[5.25rem] lg:min-w-0 lg:gap-2.5 lg:rounded-2xl lg:px-3 lg:py-2.5 dark:from-[#382515] dark:via-[#252336] dark:to-[#49301c]",
                selectedPaymentMethod === "mixed"
                  ? "-translate-y-1 scale-[1.02] border-[#57ff35] text-slate-900 shadow-[0_0_22px_rgba(57,255,20,.72)] ring-2 ring-[#57ff35] dark:text-white"
                  : "border-slate-200/80 text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-blue-300/20 dark:text-slate-200 dark:hover:border-blue-300/40"
              )}
            >
              <span aria-hidden="true" className="absolute -bottom-8 -right-5 h-14 w-24 rotate-[-12deg] rounded-[50%] bg-white/45 dark:bg-white/[0.05]" />
              {paymentMethods.length < 9 ? (
                <kbd className="absolute left-1.5 top-1.5 z-10 flex size-5 items-center justify-center rounded-md border border-white/70 bg-slate-950/75 font-mono text-[10px] font-black text-white shadow-sm">
                  {paymentMethods.length + 1}
                </kbd>
              ) : null}
              {selectedPaymentMethod === "mixed" ? <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm lg:size-5"><Check className="size-3" strokeWidth={3} /></span> : null}
              <span className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-lg shadow-orange-500/25 lg:size-11 lg:rounded-xl">
                <PaymentMethodGlyph iconKey="wallet" className="size-4 lg:size-5" />
              </span>
              <span className="relative min-w-0">
                <span className="block text-[11px] font-extrabold leading-tight text-current lg:text-xs">Pago mixto</span>
                <span className="hidden text-[10px] opacity-70 lg:block">Combinar medios</span>
              </span>
            </button>
          </div>
        </div>
        <span ref={guideCobrarRef} className="block rounded-2xl">
          <Button
            type="button"
            className={cn(
              "relative h-11 w-full rounded-xl text-sm font-extrabold lg:h-14 lg:rounded-2xl lg:text-lg lg:font-bold",
              "bg-gradient-to-r from-[#075dcc] via-[#176ee1] to-[#4b45cf] text-white hover:brightness-105 lg:bg-emerald-600 lg:hover:bg-emerald-700",
              "shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40",
              "disabled:bg-zinc-300 disabled:shadow-none dark:disabled:bg-zinc-700"
            )}
            disabled={pending || items.length === 0}
            onClick={onOpenPayment}
          >
            <span className="absolute inset-0 overflow-hidden rounded-2xl">
              <span
                className={cn(
                  "absolute -left-1/2 top-0 h-full w-1/2",
                  "bg-gradient-to-r from-transparent via-white/20 to-transparent",
                  "[transform:skewX(-20deg)]",
                  items.length > 0 ? "animate-[posShimmer_1.8s_ease-in-out_infinite]" : ""
                )}
              />
            </span>
            <span className="relative flex items-center justify-center gap-2">
              Cobrar ${selectedPaymentMethod === "mixed" ? total : chargeTotal} · {selectedPaymentMethod === "mixed" ? "Pago mixto" : selectedPayment?.label ?? "Medio de pago"}
            </span>
          </Button>
        </span>
      </div>
    </div>
  );
}
