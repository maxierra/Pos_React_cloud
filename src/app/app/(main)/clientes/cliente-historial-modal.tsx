"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  History,
  Loader2,
  ShoppingCart,
  Wallet,
  X,
} from "lucide-react";

import {
  getCustomerLedger,
  recordCustomerPayment,
  type CustomerLedgerData,
} from "@/app/app/(main)/clientes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { ClienteRow } from "@/app/app/(main)/clientes/clientes-client";

function moneyAr(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatAr(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

const METHOD_LABEL: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  mercadopago: "Mercado Pago",
};

type Props = {
  open: boolean;
  summary: ClienteRow | null;
  onClose: () => void;
};

export function ClienteHistorialModal({ open, summary, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<CustomerLedgerData | null>(null);
  const [expandedSales, setExpandedSales] = React.useState<Set<string>>(() => new Set());

  const [payMode, setPayMode] = React.useState<"total" | "partial">("total");
  const [partialAmount, setPartialAmount] = React.useState("");
  const [payMethod, setPayMethod] = React.useState<"cash" | "card" | "transfer" | "mercadopago">("cash");
  const [payNotes, setPayNotes] = React.useState("");
  const [payPending, startPayTransition] = React.useTransition();

  const customerId = summary?.id ?? null;

  React.useEffect(() => {
    if (!open || !customerId) {
      setData(null);
      setPartialAmount("");
      setPayNotes("");
      setPayMode("total");
      setExpandedSales(new Set());
      return;
    }

    let cancelled = false;
    setLoading(true);
    void getCustomerLedger(customerId)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "No se pudo cargar el historial");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, customerId]);

  const balance = data?.balance ?? summary?.balance ?? 0;

  React.useEffect(() => {
    if (payMode === "partial") {
      setPartialAmount("");
      return;
    }
    if (balance > 0) {
      setPartialAmount(String(round2(balance)));
    }
  }, [payMode, balance, open]);

  const onPay = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!customerId || !data) return;

      const max = round2(data.balance);
      if (max <= 0) {
        toast.error("No hay deuda para cobrar");
        return;
      }

      let amount = payMode === "total" ? max : parseMoneyLoose(partialAmount);
      amount = round2(amount);

      if (amount <= 0) {
        toast.error("Indicá un importe válido");
        return;
      }
      if (amount > max + 0.01) {
        toast.error("El importe no puede superar la deuda");
        return;
      }

      startPayTransition(() => {
        void (async () => {
          try {
            await recordCustomerPayment({
              customer_id: customerId,
              amount,
              payment_method: payMethod,
              notes: payNotes.trim() || null,
            });
            toast.success("Cobro registrado correctamente", {
              description: `${moneyAr(amount)} · ${METHOD_LABEL[payMethod] ?? payMethod}`,
            });
            setPayNotes("");
            onClose();
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
          }
        })();
      });
    },
    [customerId, data, onClose, partialAmount, payMethod, payMode, payNotes, router]
  );

  if (!open || !summary) return null;

  const available =
    data != null ? Math.max(0, round2(data.credit_limit - data.balance)) : summary.available_to_spend;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cliente-historial-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[min(94vh,920px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border/60 bg-gradient-to-br from-muted/50 to-muted/20 px-6 py-5">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border/60">
                <History className="size-5 text-muted-foreground" />
              </span>
              <div>
                <h2 id="cliente-historial-title" className="truncate text-xl font-semibold tracking-tight">
                  {summary.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Cuenta corriente: compras suman deuda; cobros la bajan.
                </p>
              </div>
            </div>
            <p className="pt-1 text-xs text-muted-foreground">
              <Link
                href={`/app/clientes/${summary.id}`}
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={onClose}
              >
                Ficha completa del cliente
              </Link>
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 rounded-full"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-sm">Cargando movimientos…</span>
            </div>
          ) : data ? (
            <div className="space-y-8">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Límite</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">{moneyAr(data.credit_limit)}</p>
                  <p className="mt-2 text-[11px] leading-snug text-muted-foreground">Tope de deuda permitido</p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4 shadow-sm dark:bg-amber-500/10">
                  <p className="text-xs font-medium uppercase tracking-wide text-amber-800 dark:text-amber-200/90">
                    Deuda actual
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-lg font-semibold tabular-nums tracking-tight",
                      data.balance > 0.01 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"
                    )}
                  >
                    {moneyAr(data.balance)}
                  </p>
                  <p className="mt-2 text-[11px] leading-snug text-muted-foreground">Lo que debe el cliente</p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 shadow-sm dark:bg-emerald-500/10">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-800 dark:text-emerald-200/90">
                    Disponible
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-lg font-semibold tabular-nums tracking-tight",
                      available > 0.01 ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
                    )}
                  >
                    {moneyAr(available)}
                  </p>
                  <p className="mt-2 text-[11px] leading-snug text-muted-foreground">Puede gastar aún en el POS</p>
                </div>
              </div>

              <section className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight">Movimientos</h3>
                  <p className="text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <ArrowUpRight className="size-3 text-amber-600" aria-hidden />
                      Compras aumentan la deuda.
                    </span>
                    {" · "}
                    <span className="inline-flex items-center gap-1">
                      <ArrowDownLeft className="size-3 text-emerald-600" aria-hidden />
                      Cobros la reducen.
                    </span>
                  </p>
                </div>
                <ul className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
                  {data.timeline.length === 0 ? (
                    <li className="px-5 py-12 text-center text-sm text-muted-foreground">
                      Sin movimientos todavía.
                    </li>
                  ) : (
                    data.timeline.map((row) => (
                      <li
                        key={row.key}
                        className={cn(
                          "border-b border-border/50 last:border-0",
                          row.kind === "sale" ? "border-l-[3px] border-l-amber-500/80" : "border-l-[3px] border-l-emerald-500/80"
                        )}
                      >
                        {row.kind === "sale" ? (
                          <div className="px-4 py-3.5 text-sm sm:px-5">
                            <button
                              type="button"
                              className="flex w-full items-start gap-3 text-left"
                              onClick={() => {
                                setExpandedSales((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(row.saleId)) next.delete(row.saleId);
                                  else next.add(row.saleId);
                                  return next;
                                });
                              }}
                            >
                              {expandedSales.has(row.saleId) ? (
                                <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                                    <ShoppingCart className="size-3" aria-hidden />
                                    Compra
                                  </span>
                                  <span className="font-medium text-foreground">Venta #{row.saleId.slice(0, 8)}</span>
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">{formatAr(row.at)}</div>
                              </div>
                              <span className="shrink-0 tabular-nums text-base font-semibold text-amber-600 dark:text-amber-400">
                                +{moneyAr(row.amount)}
                              </span>
                            </button>
                            {expandedSales.has(row.saleId) && row.items.length > 0 ? (
                              <ul className="mt-3 ml-9 space-y-1.5 border-l-2 border-amber-500/25 pl-4 text-xs text-muted-foreground">
                                {row.items.map((it, i) => (
                                  <li key={i} className="flex justify-between gap-4">
                                    <span className="truncate">
                                      {it.name} ×{it.quantity}
                                    </span>
                                    <span className="shrink-0 tabular-nums font-medium text-foreground">
                                      {moneyAr(it.lineTotal)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5 text-sm sm:px-5">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                                  <Wallet className="size-3" aria-hidden />
                                  Cobro
                                </span>
                                <span className="font-medium text-foreground">
                                  {METHOD_LABEL[row.method] ?? row.method}
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">{formatAr(row.at)}</div>
                              {row.notes ? (
                                <div className="mt-1.5 rounded-md bg-muted/50 px-2 py-1 text-xs italic text-foreground/90">
                                  {row.notes}
                                </div>
                              ) : null}
                            </div>
                            <span className="shrink-0 tabular-nums text-base font-semibold text-emerald-600 dark:text-emerald-400">
                              −{moneyAr(row.amount)}
                            </span>
                          </div>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </section>

              <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.07] to-primary/[0.02] p-5 shadow-sm dark:from-primary/15 dark:to-primary/5">
                <div className="mb-4">
                  <h3 className="text-base font-semibold tracking-tight">Registrar cobro</h3>
                  <p className="text-xs text-muted-foreground">
                    El dinero ingresa por el medio elegido (caja abierta). La deuda del cliente baja en el mismo importe.
                  </p>
                </div>
                <form className="grid gap-5" onSubmit={onPay}>
                  <div className="grid gap-3">
                    <span className="text-xs font-medium text-muted-foreground">Importe a cobrar</span>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border/80 bg-background px-3 py-2.5 text-sm shadow-sm has-[:checked]:border-primary/50 has-[:checked]:ring-2 has-[:checked]:ring-primary/20">
                        <input
                          type="radio"
                          name="payMode"
                          checked={payMode === "total"}
                          onChange={() => setPayMode("total")}
                          className="accent-primary"
                        />
                        <span>
                          <span className="font-medium">Total</span>
                          <span className="ml-1 tabular-nums text-muted-foreground">({moneyAr(data.balance)})</span>
                        </span>
                      </label>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-lg border border-border/80 bg-background px-3 py-2.5 text-sm shadow-sm has-[:checked]:border-primary/50 has-[:checked]:ring-2 has-[:checked]:ring-primary/20",
                          data.balance <= 0.01 && "pointer-events-none opacity-50"
                        )}
                      >
                        <input
                          type="radio"
                          name="payMode"
                          checked={payMode === "partial"}
                          onChange={() => setPayMode("partial")}
                          disabled={data.balance <= 0.01}
                          className="accent-primary"
                        />
                        <span className="font-medium">Parcial</span>
                      </label>
                    </div>
                  </div>

                  {payMode === "partial" ? (
                    <div className="grid gap-1.5">
                      <Label htmlFor="partial-amt">Importe (máx. {moneyAr(data.balance)})</Label>
                      <Input
                        id="partial-amt"
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min={0.01}
                        max={data.balance}
                        value={partialAmount}
                        onChange={(e) => setPartialAmount(e.target.value)}
                        placeholder="0,00"
                        className="h-11 max-w-md"
                        required
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border bg-background/80 px-4 py-3 text-sm text-muted-foreground">
                      Se registrará un cobro por{" "}
                      <span className="font-semibold tabular-nums text-foreground">{moneyAr(data.balance)}</span>.
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor="pay-m">Medio de pago</Label>
                      <select
                        id="pay-m"
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value as typeof payMethod)}
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm ring-offset-background transition-[box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="cash">Efectivo</option>
                        <option value="card">Tarjeta</option>
                        <option value="transfer">Transferencia</option>
                        <option value="mercadopago">Mercado Pago</option>
                      </select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="pay-n">Notas</Label>
                      <Input
                        id="pay-n"
                        value={payNotes}
                        onChange={(e) => setPayNotes(e.target.value)}
                        placeholder="Opcional"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Requiere caja abierta. El importe impacta el resumen del medio en el turno actual.
                  </p>

                  <Button type="submit" size="lg" className="w-full sm:w-auto sm:min-w-[200px]" disabled={payPending || data.balance <= 0.01}>
                    {payPending ? "Registrando…" : "Registrar cobro"}
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">No se pudo cargar la información.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function parseMoneyLoose(raw: string) {
  const normalized = raw.replace(",", ".").replace(/[^0-9.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
