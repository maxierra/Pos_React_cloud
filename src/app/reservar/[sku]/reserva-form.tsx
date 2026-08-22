"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, Clock3, Loader2, MessageCircle, Send } from "lucide-react";

import { createComboReservation } from "@/app/reservar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MetaTrackedLink } from "@/components/analytics/meta-tracked-link";
import { trackMetaCustomEvent, trackMetaEvent } from "@/components/analytics/meta-pixel";

type Props = {
  comboSku: string;
  comboTitle: string;
  price: number;
};

const PAYMENT_OPTIONS = [
  { value: "transferencia", label: "Transferencia (10% OFF)" },
  { value: "efectivo", label: "Efectivo (10% OFF)" },
  { value: "a_coordinar", label: "A coordinar" },
] as const;

export function ReservaForm({ comboSku, comboTitle, price }: Props) {
  const [pending, startTransition] = React.useTransition();
  const [submitted, setSubmitted] = React.useState(false);
  const formStarted = React.useRef(false);
  const [form, setForm] = React.useState({
    customerName: "",
    shippingAddress: "",
    phone: "",
    paymentMethod: "a_coordinar",
    notes: "",
  });

  const markFormStarted = () => {
    if (formStarted.current) return;
    formStarted.current = true;
    trackMetaCustomEvent("FormularioIniciado", {
      content_name: "Combo Punto de Venta Tienda360",
      value: price,
      currency: "ARS",
      delivery_type: "caba_amba_coordinar",
    });
  };

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
      const leadValue = form.paymentMethod === "transferencia" || form.paymentMethod === "efectivo" ? Math.round(price * 0.9) : price;
      trackMetaEvent("Lead", {
        content_name: "Combo Punto de Venta Tienda360",
        value: leadValue,
        currency: "ARS",
        delivery_type: "caba_amba_coordinar",
      });
      trackMetaCustomEvent("FormularioCompletado", {
        content_name: "Combo Punto de Venta Tienda360",
        value: leadValue,
        currency: "ARS",
        delivery_type: "caba_amba_coordinar",
        payment_method: form.paymentMethod,
      });
      toast.success("¡Gracias! Recibimos tu reserva.");
    });
  };

  if (submitted) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="overflow-hidden rounded-3xl border-2 border-emerald-300 bg-gradient-to-b from-emerald-50 to-white text-center shadow-[0_24px_70px_-32px_rgba(5,150,105,0.65)]"
      >
        <div className="bg-emerald-600 px-6 py-7 text-white">
          <CheckCircle2 className="mx-auto size-16" strokeWidth={2.25} aria-hidden="true" />
          <p className="mt-3 text-sm font-black uppercase tracking-[0.2em]">Reserva confirmada</p>
        </div>
        <div className="px-6 py-7 sm:px-8">
          <h2 className="text-3xl font-black tracking-tight text-emerald-950">¡Muchas gracias!</h2>
          <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-700">
            Recibimos correctamente tu solicitud para <strong>{comboTitle}</strong>.
          </p>
          <div className="mx-auto mt-6 grid max-w-md gap-3 text-left sm:grid-cols-2">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <MessageCircle className="size-6 text-emerald-700" aria-hidden="true" />
              <p className="mt-2 text-sm font-bold text-emerald-950">Te contactaremos en breve</p>
              <p className="mt-1 text-xs leading-5 text-emerald-900/70">Por teléfono o WhatsApp.</p>
            </div>
            <div className="rounded-2xl bg-sky-50 p-4">
              <Clock3 className="size-6 text-sky-700" aria-hidden="true" />
              <p className="mt-2 text-sm font-bold text-sky-950">Próximo paso</p>
              <p className="mt-1 text-xs leading-5 text-sky-900/70">Coordinamos pago, entrega e instalación.</p>
            </div>
          </div>
        <Link
          href="/"
          className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-700 px-6 text-sm font-bold text-white transition hover:bg-emerald-800"
        >
          Volver al inicio
        </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} onFocus={markFormStarted} className="grid gap-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="text-lg font-bold text-slate-900">{comboTitle}</div>
        <p className="mt-1 text-sm text-slate-600">
          Dejás tus datos y después te contactamos para coordinar pago y entrega.
        </p>
      </div>

      <MetaTrackedLink event="ClickComprar" eventParams={{ content_name: "Combo Punto de Venta Tienda360", value: price, currency: "ARS", delivery_type: "caba_amba_online" }} href={`/comprar/${comboSku}?delivery=local`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-700 px-4 text-center text-sm font-bold text-white">
        Prefiero pagar online con Mercado Pago
      </MetaTrackedLink>

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
