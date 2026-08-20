"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Mail } from "lucide-react";

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
      { value: state.amountArs, currency: "ARS", content_name: "Tienda360" },
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
    window.close();
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
        <>
          <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
          <h1 className="mt-4 text-xl font-bold text-slate-900">¡Compra confirmada!</h1>
          {orderId ? <div className="mx-auto mt-4 w-fit rounded-xl border border-sky-200 bg-sky-50 px-4 py-3"><p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Tu número de pedido</p><p className="mt-1 font-mono text-lg font-black text-sky-950">PED-{orderId.slice(0, 8).toUpperCase()}</p></div> : null}
          <p className="mt-2 text-sm text-slate-600">
            Enviamos tus credenciales a{" "}
            <strong>{state?.email ?? "tu email"}</strong>. Revisá también la carpeta de spam.
          </p>
          {state?.isLocalInstallation ? <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-900">Te vamos a contactar por WhatsApp para coordinar la entrega, instalación y capacitación gratis.</p> : null}
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
        </>
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
