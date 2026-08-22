"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { StoreProduct } from "@/lib/store-products";
import { formatStorePrice } from "@/lib/store-products";
import { startStoreCheckout } from "@/app/comprar/actions";
import { BUSINESS_TYPES, businessTypeLabel } from "@/lib/business-types";
import { readMetaCookie, trackMetaCustomEvent, trackMetaEvent } from "@/components/analytics/meta-pixel";

type Props = {
  product: StoreProduct;
  deliveryType?: "shipping" | "local_installation";
};

export function ComprarForm({ product, deliveryType = "shipping" }: Props) {
  const localInstallation = deliveryType === "local_installation";
  const [pending, startTransition] = React.useTransition();
  const formStarted = React.useRef(false);
  const [form, setForm] = React.useState({
    email: "",
    customerName: "",
    phone: "",
    businessName: "",
    businessType: "retail",
    shippingAddress: "",
    shippingCity: "",
    shippingProvince: localInstallation ? "Buenos Aires" : "",
    shippingPostalCode: "",
    shippingNotes: "",
  });

  const markFormStarted = () => {
    if (formStarted.current) return;
    formStarted.current = true;
    trackMetaCustomEvent("FormularioIniciado", {
      content_name: "Combo Punto de Venta Tienda360",
      value: product.price_ars,
      currency: "ARS",
      delivery_type: localInstallation ? "caba_amba_online" : "interior",
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = form.email.trim();
    const customerName = form.customerName.trim();
    const phone = form.phone.trim();
    const businessName = form.businessName.trim();

    if (!email) {
      toast.error("Ingresá tu email.");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Email inválido.");
      return;
    }
    if (!customerName) {
      toast.error("Ingresá tu nombre completo.");
      return;
    }
    if (product.includes_hardware && customerName.split(/\s+/).filter(Boolean).length < 2) {
      toast.error("Ingresá nombre y apellido completos para el envío.");
      return;
    }
    if (!phone) {
      toast.error("Ingresá tu teléfono o WhatsApp.");
      return;
    }
    if (!businessName) {
      toast.error("Ingresá el nombre de tu negocio.");
      return;
    }
    if (product.includes_hardware) {
      if (!form.shippingAddress.trim()) {
        toast.error("Ingresá la dirección de envío.");
        return;
      }
      if (!form.shippingCity.trim()) {
        toast.error("Ingresá la ciudad.");
        return;
      }
      if (!form.shippingProvince.trim()) {
        toast.error("Ingresá la provincia.");
        return;
      }
      if (!form.shippingPostalCode.trim()) {
        toast.error("Ingresá el código postal.");
        return;
      }
    }

    trackMetaEvent("InitiateCheckout", {
      content_name: "Combo Punto de Venta Tienda360",
      content_ids: [product.sku],
      content_type: "product",
      value: product.price_ars,
      currency: "ARS",
      delivery_type: localInstallation ? "caba_amba_online" : "interior",
    });

    startTransition(async () => {
      const res = await startStoreCheckout({
        sku: product.sku,
        email,
        customerName,
        phone,
        businessName: businessName,
        businessType: form.businessType,
        shippingAddress: form.shippingAddress,
        shippingCity: form.shippingCity,
        shippingProvince: form.shippingProvince,
        shippingPostalCode: form.shippingPostalCode,
        shippingNotes: form.shippingNotes,
        deliveryType,
        metaFbp: readMetaCookie("_fbp"),
        metaFbc: readMetaCookie("_fbc"),
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      trackMetaCustomEvent("FormularioCompletado", {
        content_name: "Combo Punto de Venta Tienda360",
        value: product.price_ars,
        currency: "ARS",
        delivery_type: localInstallation ? "caba_amba_online" : "interior",
        order_id: res.orderId,
      });
      window.location.href = res.checkoutUrl;
    });
  };

  return (
    <form onSubmit={submit} onFocus={markFormStarted} className="grid gap-5">
      <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
        <div className="text-lg font-bold text-slate-900">{product.name}</div>
        <div className="mt-1 text-2xl font-bold text-sky-800">{formatStorePrice(product.price_ars)}</div>
        {product.includes_hardware && product.hardware_summary ? (
          <p className="mt-2 text-sm text-slate-600">Incluye: {product.hardware_summary}</p>
        ) : null}
        <p className="mt-2 text-xs text-slate-500">Licencia de por vida del software. Acceso inmediato al pagar.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="email">Email (será tu usuario de acceso)</Label>
          <Input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="dueño@minegocio.com"
          />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="customerName">Nombre completo</Label>
          <Input
            id="customerName"
            required
            autoComplete="name"
            value={form.customerName}
            onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
            placeholder="Nombre y apellido (como en el DNI)"
          />
          {product.includes_hardware ? (
            <p className="text-xs text-muted-foreground">
              {localInstallation ? "Lo usamos para registrar la instalación." : "Lo usamos en la etiqueta de envío a tu provincia."}
            </p>
          ) : null}
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="phone">Teléfono / WhatsApp</Label>
          <Input
            id="phone"
            required
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="11 1234-5678"
          />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="businessName">Nombre del negocio</Label>
          <Input
            id="businessName"
            required
            value={form.businessName}
            onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
            placeholder="Mi kiosco"
          />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="businessType">Tipo de negocio</Label>
          <select
            id="businessType"
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            value={form.businessType}
            onChange={(e) => setForm((f) => ({ ...f, businessType: e.target.value }))}
          >
            {BUSINESS_TYPES.map((value) => (
              <option key={value} value={value}>
                {businessTypeLabel(value)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {product.includes_hardware ? (
        <fieldset className="grid gap-4 rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4">
          <legend className="px-1 text-sm font-semibold text-amber-950">{localInstallation ? "Lugar de instalación (CABA/AMBA)" : "Envío del hardware al interior"}</legend>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="shippingAddress">{localInstallation ? "Dirección del comercio" : "Dirección de envío"}</Label>
            <Input
              id="shippingAddress"
              required
              value={form.shippingAddress}
              onChange={(e) => setForm((f) => ({ ...f, shippingAddress: e.target.value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="shippingCity">{localInstallation ? "Localidad / barrio" : "Ciudad"}</Label>
              <Input
                id="shippingCity"
                required
                value={form.shippingCity}
                onChange={(e) => setForm((f) => ({ ...f, shippingCity: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="shippingProvince">{localInstallation ? "Jurisdicción" : "Provincia"}</Label>
              <Input
                id="shippingProvince"
                required
                value={form.shippingProvince}
                onChange={(e) => setForm((f) => ({ ...f, shippingProvince: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="shippingPostalCode">Código postal</Label>
            <Input
              id="shippingPostalCode"
              required
              value={form.shippingPostalCode}
              onChange={(e) => setForm((f) => ({ ...f, shippingPostalCode: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="shippingNotes">{localInstallation ? "Notas para coordinar (opcional)" : "Notas para el envío (opcional)"}</Label>
            <Input
              id="shippingNotes"
              value={form.shippingNotes}
              onChange={(e) => setForm((f) => ({ ...f, shippingNotes: e.target.value }))}
              placeholder="Horario de entrega, piso, etc."
            />
          </div>
        </fieldset>
      ) : null}

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Redirigiendo a Mercado Pago…
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 size-4" />
            Pagar {formatStorePrice(product.price_ars)}
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Al pagar aceptás recibir tus credenciales por email.{" "}
        <Link href="/auth/login" className="underline">
          ¿Ya tenés cuenta?
        </Link>
      </p>
    </form>
  );
}
