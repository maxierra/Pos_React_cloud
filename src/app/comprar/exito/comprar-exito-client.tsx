"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Loader2, Mail, MessageCircle } from "lucide-react";

import { getStoreOrderStatus } from "@/app/comprar/actions";
import { DESKTOP_PAID_DOWNLOAD_PATH } from "@/lib/desktop-download";
import { trackMetaEvent } from "@/components/analytics/meta-pixel";

type Props = {
  orderId: string | null;
  mpStatus: string | null;
};

export function ComprarExitoClient({ orderId, mpStatus }: Props) {
  const [state, setState] = React.useState<{
    provisioned: boolean;
    email: string | null;
    status: string;
    trackingToken: string | null;
    includesHardware: boolean;
    amountArs: number;
    isLocalInstallation: boolean;
  } | null>(null);

  React.useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;
      const res = await getStoreOrderStatus(orderId);
      if (cancelled || !res) return;
      setState({
        provisioned: res.provisioned,
        email: res.email,
        status: res.status,
        trackingToken: res.trackingToken,
        includesHardware: res.includesHardware,
        amountArs: res.amountArs,
        isLocalInstallation: res.isLocalInstallation,
      });
      if (!res.provisioned && attempts < 30) {
        setTimeout(poll, 2000);
      }
    };

    void poll();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const provisioned = state?.provisioned;
  const failed = mpStatus === "failure";

  React.useEffect(() => {
    if (!orderId || failed || !provisioned || !state?.amountArs) return;
    const purchaseKey = `meta-purchase-${orderId}`;
    if (window.sessionStorage.getItem(purchaseKey)) return;
    trackMetaEvent(
      "Purchase",
      { value: state.amountArs, currency: "ARS", content_name: "Combo Punto de Venta Tienda360", content_ids: ["combo_essential"], content_type: "product" },
      orderId
    );
    window.sessionStorage.setItem(purchaseKey, "1");
  }, [failed, orderId, provisioned, state?.amountArs]);

  React.useEffect(() => {
    if (!orderId) return;
    if (failed) return;
    if (!provisioned) return;
    if (typeof window === "undefined") return;
    if (!window.opener) return;

    window.opener.postMessage({ type: "store-order-paid", orderId }, window.location.origin);
  }, [failed, orderId, provisioned]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      {failed ? (
        <>
          <div className="text-lg font-bold text-red-700">El pago no se completó</div>
          <p className="mt-2 text-sm text-slate-600">Podés volver a intentar desde la landing.</p>
          <Link
            href="/"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-sky-700 px-6 text-sm font-semibold text-white"
          >
            Volver al inicio
          </Link>
        </>
      ) : provisioned ? (
        <div role="status" aria-live="polite" className="-m-8 overflow-hidden rounded-2xl">
          <div className="bg-emerald-600 px-6 py-8 text-white">
            <CheckCircle2 className="mx-auto size-16" strokeWidth={2.25} aria-hidden="true" />
            <p className="mt-3 text-sm font-black uppercase tracking-[0.2em]">Compra confirmada</p>
          </div>
          <div className="px-6 py-8 sm:px-8">
            <h1 className="text-3xl font-black tracking-tight text-emerald-950">¡Muchas gracias por tu compra!</h1>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">
              Recibimos tu pago correctamente y tu pedido ya está en proceso.
            </p>
            {orderId ? (
              <div className="mx-auto mt-5 w-fit rounded-2xl border border-sky-200 bg-sky-50 px-6 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-sky-700">Tu número de pedido</p>
                <p className="mt-1 font-mono text-xl font-black text-sky-950">PED-{orderId.slice(0, 8).toUpperCase()}</p>
              </div>
            ) : null}
            <div className="mx-auto mt-6 grid max-w-md gap-3 text-left sm:grid-cols-2">
              <div className="rounded-2xl bg-emerald-50 p-4">
                {state?.isLocalInstallation ? (
                  <MessageCircle className="size-6 text-emerald-700" aria-hidden="true" />
                ) : (
                  <Mail className="size-6 text-emerald-700" aria-hidden="true" />
                )}
                <p className="mt-2 text-sm font-bold text-emerald-950">
                  {state?.isLocalInstallation ? "Te contactaremos en breve" : "Revisá tu correo"}
                </p>
                <p className="mt-1 text-xs leading-5 text-emerald-900/70">
                  {state?.isLocalInstallation
                    ? "Por teléfono o WhatsApp."
                    : `Enviamos tus credenciales a ${state?.email ?? "tu email"}.`}
                </p>
              </div>
              <div className="rounded-2xl bg-sky-50 p-4">
                <Clock3 className="size-6 text-sky-700" aria-hidden="true" />
                <p className="mt-2 text-sm font-bold text-sky-950">Próximo paso</p>
                <p className="mt-1 text-xs leading-5 text-sky-900/70">
                  {state?.isLocalInstallation
                    ? "Coordinamos entrega, instalación y capacitación gratis."
                    : state?.includesHardware
                      ? "Prepararemos el pedido y podrás seguir el envío."
                      : "Ya podés ingresar al sistema y descargar el software."}
                </p>
              </div>
            </div>
            {!state?.isLocalInstallation ? (
              <p className="mt-4 text-xs text-slate-500">Si no encontrás el email, revisá la carpeta de spam.</p>
            ) : null}
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/auth/login"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-sky-700 px-6 text-sm font-semibold text-white"
            >
              Ingresar al sistema
            </Link>
            {!state?.includesHardware ? (
              <Link
                href={`${DESKTOP_PAID_DOWNLOAD_PATH}?order=${encodeURIComponent(orderId ?? "")}`}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-6 text-sm font-semibold text-emerald-900"
              >
                Descargar software
              </Link>
            ) : null}
            {state?.includesHardware && !state.isLocalInstallation && state.trackingToken ? (
              <Link
                href={`/pedido/${state.trackingToken}`}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-6 text-sm font-semibold text-sky-900"
              >
                Ver estado del envío
              </Link>
            ) : null}
          </div>
          </div>
        </div>
      ) : (
        <>
          <Loader2 className="mx-auto size-10 animate-spin text-sky-600" />
          <h1 className="mt-4 text-xl font-bold text-slate-900">Procesando tu pago…</h1>
          <p className="mt-2 text-sm text-slate-600">
            Estamos activando tu cuenta. En unos segundos recibirás un email con tu contraseña.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500">
            <Mail className="size-3.5" />
            No cierres esta página
          </div>
        </>
      )}
    </div>
  );
}
