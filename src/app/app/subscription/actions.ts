"use server";



import { cookies } from "next/headers";



import { MercadoPagoConfig, Preference } from "mercadopago";



import { getAppBaseUrl } from "@/lib/app-base-url";
import { createClient } from "@/lib/supabase/server";



export type PlanKey = "monthly" | "semester" | "annual";



const PLAN_ENV: Record<PlanKey, { amountKey: string; daysKey: string; titleKey: string; defaultAmount: string; defaultDays: string; defaultTitle: string }> = {

  monthly: {

    amountKey: "MERCADOPAGO_PLAN_MONTHLY_AMOUNT",

    daysKey: "MERCADOPAGO_PLAN_MONTHLY_DAYS",

    titleKey: "MERCADOPAGO_PLAN_MONTHLY_TITLE",

    defaultAmount: "15",

    defaultDays: "30",

    defaultTitle: "Plan mensual — Punto de venta",

  },

  semester: {

    amountKey: "MERCADOPAGO_PLAN_SEMESTER_AMOUNT",

    daysKey: "MERCADOPAGO_PLAN_SEMESTER_DAYS",

    titleKey: "MERCADOPAGO_PLAN_SEMESTER_TITLE",

    defaultAmount: "80",

    defaultDays: "180",

    defaultTitle: "Plan semestral — Punto de venta",

  },

  annual: {

    amountKey: "MERCADOPAGO_PLAN_ANNUAL_AMOUNT",

    daysKey: "MERCADOPAGO_PLAN_ANNUAL_DAYS",

    titleKey: "MERCADOPAGO_PLAN_ANNUAL_TITLE",

    defaultAmount: "150",

    defaultDays: "365",

    defaultTitle: "Plan anual — Punto de venta",

  },

};



export async function getPlanConfig(planKey: PlanKey = "monthly") {

  const cfg = PLAN_ENV[planKey];

  const amount = Number.parseFloat(process.env[cfg.amountKey] ?? cfg.defaultAmount);

  const days = Number.parseInt(process.env[cfg.daysKey] ?? cfg.defaultDays, 10);

  const currency = (process.env.MERCADOPAGO_PLAN_CURRENCY ?? "ARS").trim().toUpperCase();

  const title = (process.env[cfg.titleKey] ?? cfg.defaultTitle).trim();

  if (!Number.isFinite(amount) || amount <= 0) {

    throw new Error("invalid_plan_amount");

  }

  return { amount, currency, title, days, planKey };

}



export async function getAllPlansConfig() {

  const [monthly, semester, annual] = await Promise.all([
    getPlanConfig("monthly"),
    getPlanConfig("semester"),
    getPlanConfig("annual"),
  ]);

  return { monthly, semester, annual };

}



export async function startMercadoPagoCheckout(planKey: PlanKey = "monthly"): Promise<{ checkoutUrl: string } | { error: string }> {

  const token = (process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").trim();

  if (!token) {

    return { error: "Falta MERCADOPAGO_ACCESS_TOKEN en el servidor." };

  }



  const cookieStore = await cookies();

  const businessId = cookieStore.get("active_business_id")?.value;

  if (!businessId) {

    return { error: "No hay negocio activo." };

  }



  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {

    return { error: "Sesión inválida." };

  }



  const { data: membership, error: memErr } = await supabase

    .from("memberships")

    .select("business_id")

    .eq("business_id", businessId)

    .eq("user_id", userData.user.id)

    .maybeSingle();



  if (memErr || !membership) {

    return { error: "No tenés acceso a este negocio." };

  }



  const { amount, currency, title } = await getPlanConfig(planKey);

  const base = getAppBaseUrl();
  const notificationUrl = `${base}/api/webhooks/mercadopago`;

  const client = new MercadoPagoConfig({ accessToken: token });
  const preference = new Preference(client);

  const body = {
    items: [
      {
        id: `${planKey}-plan`,

        title,

        quantity: 1,

        currency_id: currency,

        unit_price: amount,

      },

    ],

    external_reference: businessId,

    metadata: { business_id: businessId, plan_key: planKey },

    notification_url: notificationUrl,

    back_urls: {

      success: `${base}/app/subscription?mp=success`,

      pending: `${base}/app/subscription?mp=pending`,

      failure: `${base}/app/subscription?mp=failure`,

    },

    auto_return: "approved" as const,

  };



  try {

    const res = await preference.create({ body });

    const useSandbox = process.env.MERCADOPAGO_USE_SANDBOX === "1";

    const checkoutUrl = useSandbox ? res.sandbox_init_point : res.init_point;

    if (!checkoutUrl) {

      return { error: "Mercado Pago no devolvió URL de pago." };

    }

    return { checkoutUrl };

  } catch (e) {
    console.error("[mercadopago] preference.create failed:", e);

    const msg =
      e instanceof Error
        ? e.message
        : typeof e === "object" && e !== null && "message" in e && typeof (e as { message: unknown }).message === "string"
          ? (e as { message: string }).message
          : String(e);

    return {
      error: msg && msg !== "[object Object]" ? msg : "Error al crear el checkout.",
    };
  }

}

