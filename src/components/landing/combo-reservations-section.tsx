"use client";

import * as React from "react";
import Image, { type StaticImageData } from "next/image";
import { X } from "lucide-react";
import { toast } from "sonner";

import { createComboReservation } from "@/app/reservar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ComboItem = {
  sku: string;
  title: string;
  description: string;
  image: StaticImageData;
};

type Props = {
  combos: ComboItem[];
};

const PAYMENT_OPTIONS = [
  { value: "mercadopago", label: "Mercado Pago" },
  { value: "transferencia", label: "Transferencia" },
  { value: "efectivo", label: "Efectivo" },
  { value: "a_coordinar", label: "A coordinar" },
] as const;

export function ComboReservationsSection({ combos }: Props) {
  const [selected, setSelected] = React.useState<ComboItem | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [submitted, setSubmitted] = React.useState(false);
  const [form, setForm] = React.useState({
    customerName: "",
    shippingAddress: "",
    phone: "",
    paymentMethod: "mercadopago",
    notes: "",
  });

  const closeModal = React.useCallback(() => {
    if (pending) return;
    setSelected(null);
    setSubmitted(false);
    setForm({
      customerName: "",
      shippingAddress: "",
      phone: "",
      paymentMethod: "mercadopago",
      notes: "",
    });
  }, [pending]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    startTransition(async () => {
      const res = await createComboReservation({
        comboSku: selected.sku,
        comboTitle: selected.title,
        customerName: form.customerName,
        shippingAddress: form.shippingAddress,
        phone: form.phone,
        paymentMethod: form.paymentMethod as
          | "mercadopago"
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
      toast.success("Reserva enviada. Te vamos a contactar para coordinar.");
    });
  };

  return (
    <>
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-8 sm:px-10" aria-labelledby="combos-heading">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="combos-heading"
            className="font-serif text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
          >
            Nuestros combos para comercios
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Instalación disponible solo en CABA y GBA. No realizamos envíos al interior.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {combos.map((combo) => (
            <article
              key={combo.title}
              className="rounded-[1.75rem] border border-white/80 bg-white/90 p-4 shadow-[0_24px_64px_-34px_rgba(15,23,42,0.35)]"
            >
              <div className="overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-slate-50 p-3">
                <div className="flex min-h-[320px] items-center justify-center rounded-[1rem] bg-slate-950/5">
                  <Image
                    src={combo.image}
                    alt={combo.title}
                    className="h-auto max-h-[320px] w-auto rounded-[1rem] object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  />
                </div>
              </div>

              <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">{combo.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{combo.description}</p>
              <button
                type="button"
                onClick={() => setSelected(combo)}
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-800 transition hover:border-slate-900 hover:text-slate-950"
              >
                Reservar este combo
              </button>
            </article>
          ))}
        </div>
      </section>

      {selected ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="relative w-full max-w-xl rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_30px_80px_-32px_rgba(15,23,42,0.45)]">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>

            {submitted ? (
              <div className="space-y-3 pr-10">
                <h3 className="text-2xl font-bold tracking-tight text-slate-950">Reserva registrada</h3>
                <p className="text-sm leading-7 text-slate-600">
                  Ya recibimos tus datos para <strong>{selected.title}</strong>. La reserva queda en el panel
                  admin y te vamos a contactar para coordinar el pago y la entrega.
                </p>
                <Button type="button" onClick={closeModal} className="mt-2">
                  Cerrar
                </Button>
              </div>
            ) : (
              <>
                <div className="pr-10">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">Reserva de combo</p>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{selected.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Completá estos datos y te contactamos para coordinar la instalación. Los combos
                    están disponibles solo en CABA y GBA, no hacemos envíos al interior, y el pago
                    se realiza después de instalar el equipo.
                  </p>
                </div>

                <form onSubmit={submit} className="mt-6 grid gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="combo-customerName">Nombre completo</Label>
                    <Input
                      id="combo-customerName"
                      required
                      value={form.customerName}
                      onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="combo-shippingAddress">Dirección exacta</Label>
                    <Input
                      id="combo-shippingAddress"
                      required
                      value={form.shippingAddress}
                      onChange={(e) => setForm((f) => ({ ...f, shippingAddress: e.target.value }))}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="combo-phone">Teléfono / WhatsApp</Label>
                    <Input
                      id="combo-phone"
                      required
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="combo-paymentMethod">Método de pago</Label>
                    <select
                      id="combo-paymentMethod"
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
                    <Label htmlFor="combo-notes">Notas opcionales</Label>
                    <Input
                      id="combo-notes"
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Referencia de entrega, horario, etc."
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={closeModal} disabled={pending} className="flex-1">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={pending} className="flex-1">
                      {pending ? "Enviando..." : "Reservar combo"}
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
