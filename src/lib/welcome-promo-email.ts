import type { SupabaseClient } from "@supabase/supabase-js";

import type { PlanKey } from "@/app/app/subscription/actions";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { randomSubscriptionPromoCode } from "@/lib/promo-code";
import { sendTransactionalEmail } from "@/lib/resend-server";
import { createAdminClient } from "@/lib/supabase/admin";

function planLabelEs(k: PlanKey): string {
  if (k === "monthly") return "mensual";
  if (k === "semester") return "semestral";
  return "anual";
}

async function insertWelcomePromo(
  admin: SupabaseClient,
  businessId: string,
  discountPercent: number,
  planKey: PlanKey
): Promise<string | null> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomSubscriptionPromoCode();
    const { error: insErr } = await admin.from("subscription_promo_codes").insert({
      code,
      business_id: businessId,
      discount_percent: discountPercent,
      plan_key: planKey,
      expires_at: null,
      note: "Bienvenida automática (primer negocio)",
    });
    if (!insErr) return code;
    const codePg = (insErr as { code?: string }).code;
    const msg = insErr.message ?? "";
    if (codePg !== "23505" && !msg.includes("duplicate") && !msg.includes("unique")) {
      console.error("[welcome-promo] insert", insErr);
      return null;
    }
  }
  return null;
}

/**
 * Si está habilitado en platform_settings, genera un código de descuento para el negocio
 * y lo envía al mail del usuario (solo en el **primer** negocio de la cuenta).
 * El mail de confirmación de Supabase es independiente; este correo lo manda Resend.
 */
export async function sendWelcomePromoAfterFirstBusiness(input: {
  userId: string;
  userEmail: string;
  businessId: string;
  businessName: string;
}): Promise<void> {
  try {
    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return;
    }

    const { data: settings, error: setErr } = await admin
      .from("platform_settings")
      .select("welcome_promo_enabled, welcome_promo_discount_percent, welcome_promo_plan_key")
      .eq("id", 1)
      .maybeSingle();

    if (setErr || !settings) return;

    const enabled = Boolean((settings as { welcome_promo_enabled?: boolean }).welcome_promo_enabled);
    if (!enabled) return;

    const { count, error: countErr } = await admin
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("user_id", input.userId)
      .eq("role", "owner")
      .is("deleted_at", null);

    if (countErr || count !== 1) return;

    const { data: dup } = await admin
      .from("subscription_promo_codes")
      .select("id")
      .eq("business_id", input.businessId)
      .ilike("note", "%Bienvenida automática%")
      .maybeSingle();
    if (dup) return;

    const rawPct = (settings as { welcome_promo_discount_percent?: number }).welcome_promo_discount_percent;
    const discount = Math.min(100, Math.max(1, Number(rawPct ?? 50)));
    const rawPlan = String((settings as { welcome_promo_plan_key?: string }).welcome_promo_plan_key ?? "monthly");
    const planKey = (["monthly", "semester", "annual"].includes(rawPlan) ? rawPlan : "monthly") as PlanKey;

    const code = await insertWelcomePromo(admin, input.businessId, discount, planKey);
    if (!code) return;

    const email = input.userEmail.trim();
    if (!email) return;

    const base = getAppBaseUrl();
    const subUrl = `${base}/app/subscription`;

    await sendTransactionalEmail(
      email,
      `Tu código de descuento — ${input.businessName}`,
      [
        "Hola,",
        "",
        `Gracias por crear tu negocio "${input.businessName}" en la plataforma.`,
        "",
        `Tu código de descuento del ${discount}% en el plan ${planLabelEs(planKey)} es:`,
        "",
        `  ${code}`,
        "",
        "Ingresá a Suscripción en la app y pegalo al contratar, o abrí:",
        `  ${subUrl}`,
        "",
        "El código es solo para tu negocio y se puede usar una vez al pagar con Mercado Pago.",
        "",
        "—",
      ].join("\n")
    );
  } catch (e) {
    console.warn("[welcome-promo]", e);
  }
}
