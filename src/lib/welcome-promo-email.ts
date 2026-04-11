import type { SupabaseClient } from "@supabase/supabase-js";

import type { PlanKey } from "@/app/app/subscription/actions";
import { randomSubscriptionPromoCode } from "@/lib/promo-code";
import { createAdminClient } from "@/lib/supabase/admin";

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
 * (solo en el **primer** negocio de la cuenta).
 * La entrega al cliente es manual (sin envío automático por correo).
 */
export async function sendWelcomePromoAfterFirstBusiness(input: {
  userId: string;
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
    console.log(
      `[welcome-promo] generado para ${input.businessName} (${input.businessId}) -> ${code} (${discount}% ${planKey})`
    );
  } catch (e) {
    console.warn("[welcome-promo]", e);
  }
}
