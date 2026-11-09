import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { getAllPlansConfig } from "@/app/app/subscription/actions";
import { SubscriptionClient } from "@/app/app/subscription/subscription-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscriptionWithAutoTrial } from "@/lib/supabase/ensure-subscription-trial";

const DEFAULT_MANUAL_MP_ALIAS = "tienda360.mp";
const DEFAULT_MANUAL_PHONE = "11 2314-5742";

function manualContactFromEnv() {
  const mpAlias =
    (process.env.NEXT_PUBLIC_SUBSCRIPTION_MANUAL_MP_ALIAS ?? "").trim() || DEFAULT_MANUAL_MP_ALIAS;
  const phoneDisplay =
    (process.env.NEXT_PUBLIC_SUBSCRIPTION_MANUAL_PHONE ?? "").trim() || DEFAULT_MANUAL_PHONE;
  const whatsappDigits = (process.env.NEXT_PUBLIC_SUBSCRIPTION_MANUAL_WHATSAPP ?? "").replace(/\D/g, "");
  const cbu = (process.env.NEXT_PUBLIC_SUBSCRIPTION_MANUAL_CBU ?? "").trim();
  const transferHolder = (process.env.NEXT_PUBLIC_SUBSCRIPTION_MANUAL_TRANSFER_HOLDER ?? "").trim();
  const transferNote = (process.env.NEXT_PUBLIC_SUBSCRIPTION_MANUAL_TRANSFER_NOTE ?? "").trim();
  return { mpAlias, phoneDisplay, whatsappDigits, cbu, transferHolder, transferNote };
}

export default async function SubscriptionPage() {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;
  const manualContact = manualContactFromEnv();
  const mercadoPagoConfigured = Boolean((process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").trim());
  const plans = await getAllPlansConfig();

  if (!businessId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Suscripcion</CardTitle>
            <CardDescription>Selecciona o crea un negocio primero.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/app/setup" className="text-sm underline">
              Ir a configuracion
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();
  const { row: subscription, errorMessage: subErrorMessage } = await fetchSubscriptionWithAutoTrial(
    supabase,
    businessId
  );

  return (
    <div className="relative isolate min-h-[60vh]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [mask-image:linear-gradient(180deg,black,transparent_95%)]"
      >
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[color-mix(in_oklab,var(--pos-accent)_22%,transparent)] blur-3xl" />
        <div className="absolute right-0 top-20 h-72 w-72 rounded-full bg-[color-mix(in_oklab,var(--sub-sky)_35%,transparent)] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[color-mix(in_oklab,var(--sub-orchid)_12%,transparent)] blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-[1320px] px-4 pb-14 pt-4">
        <header
          className="relative min-h-[190px] overflow-hidden rounded-[28px] border border-cyan-300/25 px-7 py-9 text-white shadow-[0_24px_70px_-35px_rgba(37,99,235,.9)] md:px-10 md:py-11"
          style={{ background: "radial-gradient(circle at 78% 0%,rgba(34,211,238,.26),transparent 30%),radial-gradient(circle at 18% 110%,rgba(124,58,237,.48),transparent 42%),linear-gradient(120deg,#11134d 0%,#123f9c 55%,#062b54 100%)" }}
        >
          <div aria-hidden className="absolute -bottom-20 left-[32%] h-32 w-[42%] rotate-[-5deg] rounded-[50%] border-t-2 border-cyan-300/60 shadow-[0_-8px_35px_rgba(34,211,238,.35)]" />
          <div className="relative z-10 max-w-3xl">
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">
              Mi <span className="text-cyan-300">Suscripción</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-100 md:text-base">
              Gestioná tu plan y mantené tu negocio siempre activo con todas las funciones de Tienda360.
            </p>
          </div>

          <Image src="/images/subscription/subscription-hero-laptop.png" alt="Comercio Tienda360 en una notebook" width={620} height={310} priority className="pointer-events-none absolute -bottom-16 right-2 hidden h-auto w-[520px] object-contain drop-shadow-[0_22px_30px_rgba(0,0,0,.32)] lg:block" />
        </header>

        <div className="mt-5">
          <Suspense
            fallback={
              <div className="flex h-32 items-center justify-center rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface)] text-sm text-muted-foreground">
                Cargando...
              </div>
            }
          >
            <SubscriptionClient
              businessId={businessId}
              subscription={subscription}
              plans={plans}
              loadError={subErrorMessage ?? null}
              mercadoPagoConfigured={mercadoPagoConfigured}
              manualContact={manualContact}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
