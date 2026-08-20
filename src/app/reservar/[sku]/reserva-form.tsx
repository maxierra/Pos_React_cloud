"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

import { createComboReservation } from "@/app/reservar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  comboSku: string;
  comboTitle: string;
};

const PAYMENT_OPTIONS = [
  { value: "transferencia", label: "Transferencia (10% OFF)" },
  { value: "efectivo", label: "Efectivo (10% OFF)" },
  { value: "a_coordinar", label: "A coordinar" },
] as const;

export function ReservaForm({ comboSku, comboTitle }: Props) {
  const [pending, startTransition] = React.useTransition();
  const [submitted, setSubmitted] = React.useState(false);
  const [form, setForm] = React.useState({
    customerName: "",
    shippingAddress: "",
    phone: "",
    paymentMethod: "a_coordinar",
    notes: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createComboReservation({
        comboSku,
        comboTitle,
        customerName: form.customerName,
        shippingAddress: form.shippingAddress,
        phone: form.phone,
        paymentMethod: form.paymentMethod as
          | "transferencia"
          | "efectivo"
          | "a_coordinar",
        notes: form.notes,
      });

      if ("error" in res) {
        toast.error(res.error);
        return;
      }

      setSubmitted(true);
      toast.success("Reserva enviada. Te contactamos para coordinar la entrega.");
    });
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-center">
        <h2 className="text-xl font-bold text-emerald-950">Reserva registrada</h2>
        <p className="mt-2 text-sm leading-6 text-emerald-900/80">
          Ya recibimos tus datos para <strong>{comboTitle}</strong>. Ahora lo vas a ver en admin y
          te vamos a contactar para coordinar el pago y la entrega.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="text-lg font-bold text-slate-900">{comboTitle}</div>
        <p className="mt-1 text-sm text-slate-600">
          Dejás tus datos y después te contactamos para coordinar pago y entrega.
        </p>
      </div>

      <Link href={`/comprar/${comboSku}?delivery=local`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-700 px-4 text-center text-sm font-bold text-white">
        Prefiero pagar online con Mercado Pago
      </Link>

      <div className="grid gap-1.5">
        <Label htmlFor="customerName">Nombre completo</Label>
        <Input
          id="customerName"
          required
          value={form.customerName}
          onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
          placeholder="Nombre y apellido"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="shippingAddress">Dirección exacta</Label>
        <Input
          id="shippingAddress"
          required
          value={form.shippingAddress}
          onChange={(e) => setForm((f) => ({ ...f, shippingAddress: e.target.value }))}
          placeholder="Calle, número, piso, localidad"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="phone">Teléfono / WhatsApp</Label>
        <Input
          id="phone"
          required
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="11 1234-5678"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="paymentMethod">Método de pago</Label>
        <select
          id="paymentMethod"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={form.paymentMethod}
          onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
        >
          {PAYMENT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="notes">Notas opcionales</Label>
        <Input
          id="notes"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Horario de contacto, referencia de entrega, etc."
        />
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Guardando reserva…
          </>
        ) : (
          <>
            <Send className="mr-2 size-4" />
            Reservar combo
          </>
        )}
      </Button>
    </form>
  );
}
