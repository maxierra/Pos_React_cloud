"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { recordCustomerPayment } from "@/app/app/(main)/clientes/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    credit_limit: number;
    balance: number;
  };
  sales: Array<{ id: string; total: number | string; created_at: string; status: string }>;
  payments: Array<{
    id: string;
    amount: number | string;
    payment_method: string;
    created_at: string;
    notes: string | null;
  }>;
};

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function parseMoneyLoose(raw: string) {
  const normalized = raw.replace(",", ".").replace(/[^0-9.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function ClienteDetalleClient({ customer, sales, payments }: Props) {
  const router = useRouter();
  const [payMode, setPayMode] = React.useState<"total" | "partial">("total");
  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState<"cash" | "card" | "transfer" | "mercadopago">("cash");
  const [notes, setNotes] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (payMode === "partial") {
      setAmount("");
      return;
    }
    if (customer.balance > 0) {
      setAmount(String(round2(customer.balance)));
    }
  }, [payMode, customer.balance]);

  const onPay = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const max = round2(customer.balance);
      if (max <= 0) {
        toast.error("No hay deuda para cobrar");
        return;
      }
      const n = payMode === "total" ? max : round2(parseMoneyLoose(amount));
      if (!Number.isFinite(n) || n <= 0) {
        toast.error("Importe inválido");
        return;
      }
      if (n > max + 0.01) {
        toast.error("El importe no puede superar la deuda");
        return;
      }
      startTransition(() => {
        void (async () => {
          try {
            await recordCustomerPayment({
              customer_id: customer.id,
              amount: n,
              payment_method: method,
              notes: notes.trim() || null,
            });
            toast.success("Cobro registrado");
            setAmount("");
            setNotes("");
            setPayMode("total");
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
          }
        })();
      });
    },
    [amount, customer.balance, customer.id, method, notes, payMode, router]
  );

  const timeline = React.useMemo(() => {
    type T =
      | { kind: "sale"; at: string; label: string; amount: number }
      | { kind: "pay"; at: string; label: string; amount: number };
    const out: T[] = [];
    for (const s of sales) {
      if (s.status !== "paid") continue;
      const t = typeof s.total === "number" ? s.total : Number(s.total);
      out.push({
        kind: "sale",
        at: s.created_at,
        label: `Venta #${String(s.id).slice(0, 8)} (cuenta corriente)`,
        amount: Number.isFinite(t) ? t : 0,
      });
    }
    for (const p of payments) {
      const t = typeof p.amount === "number" ? p.amount : Number(p.amount);
      const ml = METHOD_LABEL[p.payment_method] ?? p.payment_method;
      out.push({
        kind: "pay",
        at: p.created_at,
        label: `Cobro · ${ml}`,
        amount: Number.isFinite(t) ? t : 0,
      });
    }
    out.sort((a, b) => (a.at < b.at ? 1 : -1));
    return out;
  }, [payments, sales]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Link href="/app/clientes" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
          ← Volver a clientes
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{customer.name}</CardTitle>
          <CardDescription>
            {[customer.phone, customer.email].filter(Boolean).join(" · ") || "Sin contacto"}
            {customer.address ? ` · ${customer.address}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <span className="text-muted-foreground">Límite de crédito</span>
            <span className="font-medium tabular-nums">{moneyAr(customer.credit_limit)}</span>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <span className="text-muted-foreground">Deuda actual</span>
            <span
              className={
                "font-semibold tabular-nums " +
                (customer.balance > 0.01 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")
              }
            >
              {moneyAr(customer.balance)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Registrar cobro</CardTitle>
          <CardDescription>
            Ingresá el monto con el medio real (efectivo, tarjeta, etc.). Debe haber una caja abierta. El cobro figura en
            caja y baja la deuda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onPay}>
            <div className="grid gap-2 md:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">Tipo de cobro</span>
              <div className="flex flex-wrap gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="detalle_pay"
                    checked={payMode === "total"}
                    onChange={() => setPayMode("total")}
                    className="accent-primary"
                  />
                  Pago total ({moneyAr(customer.balance)})
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="detalle_pay"
                    checked={payMode === "partial"}
                    onChange={() => setPayMode("partial")}
                    disabled={customer.balance <= 0.01}
                    className="accent-primary"
                  />
                  Pago parcial
                </label>
              </div>
            </div>
            {payMode === "partial" ? (
              <div className="grid gap-1.5 md:col-span-2">
                <Label htmlFor="pay_amt">Importe (máx. {moneyAr(customer.balance)})</Label>
                <Input
                  id="pay_amt"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0.01}
                  max={Math.max(customer.balance, 0)}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground md:col-span-2">
                Se registrará un cobro por <span className="font-semibold text-foreground">{moneyAr(customer.balance)}</span>.
              </p>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="pay_m">Medio</Label>
              <select
                id="pay_m"
                value={method}
                onChange={(e) => setMethod(e.target.value as typeof method)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
                <option value="mercadopago">Mercado Pago</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pay_n">Notas</Label>
              <Input id="pay_n" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={pending || customer.balance <= 0.01}>
                {pending ? "Registrando…" : "Registrar cobro"}
              </Button>
              {customer.balance <= 0.01 ? (
                <p className="mt-2 text-xs text-muted-foreground">No hay deuda para cobrar.</p>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial</CardTitle>
          <CardDescription>Ventas a cuenta corriente y cobros registrados.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {timeline.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">Sin movimientos.</li>
            ) : (
              timeline.map((row, i) => (
                <li key={`${row.kind}-${i}-${row.at}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium">{row.label}</div>
                    <div className="text-xs text-muted-foreground">{formatAr(row.at)}</div>
                  </div>
                  <div
                    className={
                      "tabular-nums font-semibold " +
                      (row.kind === "sale" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")
                    }
                  >
                    {row.kind === "sale" ? "+" : "−"}
                    {moneyAr(row.amount)}
                  </div>
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
