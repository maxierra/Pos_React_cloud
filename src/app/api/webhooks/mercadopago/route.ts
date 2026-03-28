import { NextResponse } from "next/server";

import { MercadoPagoConfig, Payment } from "mercadopago";


import { createAdminClient } from "@/lib/supabase/admin";


export const dynamic = "force-dynamic";

function getPlanDays(planKey: string | undefined): number {
  if (!planKey) return 30;
  
  const planDays: Record<string, number> = {
    monthly: 30,
    semester: 180,
    annual: 365,
  };
  
  return planDays[planKey] ?? 30;
}

function getPaymentIdFromPayload(body: unknown): string | null {

  if (!body || typeof body !== "object") return null;

  const o = body as Record<string, unknown>;



  if (o.type === "payment" && o.data && typeof o.data === "object") {

    const id = (o.data as Record<string, unknown>).id;

    if (id != null) return String(id);

  }



  if (o.topic === "payment") {

    if (o.id != null) return String(o.id);

    if (typeof o.resource === "string") {

      const r = o.resource;

      if (/^\d+$/.test(r)) return r;

      const last = r.split("/").pop();

      if (last && /^\d+$/.test(last)) return last;

    }

  }



  if (o.action && o.data && typeof o.data === "object") {

    const id = (o.data as Record<string, unknown>).id;

    if (id != null) return String(id);

  }



  return null;

}



async function processApprovedPayment(paymentId: string) {

  const token = (process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").trim();

  if (!token) {

    return NextResponse.json({ ok: false, error: "no_mp_token" }, { status: 503 });

  }



  const client = new MercadoPagoConfig({ accessToken: token });

  const paymentApi = new Payment(client);



  let payment: {
    status?: string;
    external_reference?: string | null;
    transaction_amount?: number;
    currency_id?: string;
    id?: number | string;
    metadata?: Record<string, unknown>;
  };



  try {

    payment = await paymentApi.get({ id: paymentId });

  } catch {

    return NextResponse.json({ ok: false, error: "payment_fetch" }, { status: 502 });

  }



  if (payment.status !== "approved") {

    return NextResponse.json({ ok: true, status: payment.status });

  }



  const businessId = String(payment.external_reference ?? "").trim();

  if (!businessId || !/^[0-9a-f-]{36}$/i.test(businessId)) {

    return NextResponse.json({ ok: true, ignored: "no_business_ref" });

  }



  let admin;

  try {

    admin = createAdminClient();

  } catch {

    return NextResponse.json({ ok: false, error: "no_admin_client" }, { status: 503 });

  }



  const providerPaymentId = String(payment.id ?? paymentId);

  const planKey = (payment.metadata as Record<string, unknown>)?.plan_key as string | undefined;
  const periodDays = getPlanDays(planKey);
  const now = new Date();
  const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);



  const { data: subRow } = await admin

    .from("subscriptions")

    .select("id")

    .eq("business_id", businessId)

    .maybeSingle();



  const subscriptionId = subRow?.id as string | undefined;



  const { error: payErr } = await admin.from("payments").insert({

    business_id: businessId,

    subscription_id: subscriptionId ?? null,

    provider: "mercadopago",

    provider_payment_id: providerPaymentId,

    amount: Number(payment.transaction_amount ?? 0),

    currency: String(payment.currency_id ?? "ARS"),

    status: "approved",

    raw: payment as unknown as Record<string, unknown>,

  });



  if (payErr) {

    console.error("payments insert", payErr);

    return NextResponse.json({ ok: false }, { status: 500 });

  }



  const { error: subErr } = await admin

    .from("subscriptions")

    .upsert(

      {

        business_id: businessId,

        plan_id: "standard",

        status: "active",

        current_period_start: now.toISOString(),

        current_period_end: periodEnd.toISOString(),

        provider: "mercadopago",

        updated_at: now.toISOString(),

      },

      { onConflict: "business_id" }

    );



  if (subErr) {

    console.error("subscriptions upsert", subErr);

    return NextResponse.json({ ok: false }, { status: 500 });

  }



  return NextResponse.json({ ok: true });

}



/**

 * Mercado Pago envía notificaciones por POST (JSON o form).

 * Verificamos el pago con la API usando el access token y actualizamos la suscripción.

 */

export async function POST(request: Request) {

  let raw: unknown;

  const ct = request.headers.get("content-type") ?? "";

  try {

    if (ct.includes("application/json")) {

      raw = await request.json();

    } else {

      const text = await request.text();

      try {

        raw = JSON.parse(text);

      } catch {

        const params = new URLSearchParams(text);

        const topic = params.get("topic");

        const id = params.get("id") ?? params.get("data.id");

        raw = topic && id ? { topic, id } : {};

      }

    }

  } catch {

    return NextResponse.json({ ok: false }, { status: 400 });

  }



  const paymentId = getPaymentIdFromPayload(raw);

  if (!paymentId) {

    return NextResponse.json({ ok: true, ignored: true });

  }



  return processApprovedPayment(paymentId);

}



/** Algunas integraciones consultan por GET */

export async function GET(request: Request) {

  const url = new URL(request.url);

  const topic = url.searchParams.get("topic");

  const id = url.searchParams.get("id") ?? url.searchParams.get("data.id");

  if (topic === "payment" && id) {

    return processApprovedPayment(id);

  }

  return NextResponse.json({ ok: true });

}

