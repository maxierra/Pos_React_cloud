"use server";

import { revalidatePath } from "next/cache";

import { createMonitoredAction } from "@/lib/action-wrapper";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformAdminSessionEmail } from "@/lib/platform-admin-session";
import { parseAlertSettingsRow, type AdminAlertSettingsRow } from "@/lib/admin-alerts-send";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function fetchAdminAlertSettings(): Promise<AdminAlertSettingsRow | null> {
  const adminEmail = await getPlatformAdminSessionEmail();
  if (!adminEmail) return null;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      admin_alert_email: null,
      alert_on_user_signup: false,
      alert_on_subscription_payment: false,
      welcome_promo_enabled: false,
      welcome_promo_discount_percent: 50,
      welcome_promo_plan_key: "monthly",
    };
  }

  const { data, error } = await admin
    .from("platform_settings")
    .select(
      "admin_alert_email, alert_on_user_signup, alert_on_subscription_payment, welcome_promo_enabled, welcome_promo_discount_percent, welcome_promo_plan_key"
    )
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return {
      admin_alert_email: null,
      alert_on_user_signup: false,
      alert_on_subscription_payment: false,
      welcome_promo_enabled: false,
      welcome_promo_discount_percent: 50,
      welcome_promo_plan_key: "monthly",
    };
  }
  return parseAlertSettingsRow(data as Record<string, unknown>);
}

async function saveAdminAlertSettingsImpl(formData: FormData) {
  const adminEmail = await getPlatformAdminSessionEmail();
  if (!adminEmail) {
    return { ok: false as const, error: "No autorizado." };
  }

  const rawEmail = String(formData.get("admin_alert_email") ?? "").trim();
  const signup = formData.get("alert_on_user_signup") === "on";
  const payment = formData.get("alert_on_subscription_payment") === "on";
  const welcomePromo = formData.get("welcome_promo_enabled") === "on";
  const welcomePct = Number(formData.get("welcome_promo_discount_percent") ?? 50);
  const welcomePlan = String(formData.get("welcome_promo_plan_key") ?? "monthly").trim();
  const planKey =
    welcomePlan === "semester" || welcomePlan === "annual" ? welcomePlan : "monthly";

  if (rawEmail && !EMAIL_RE.test(rawEmail)) {
    return { ok: false as const, error: "El correo de destino no es válido." };
  }

  if (!Number.isFinite(welcomePct) || welcomePct < 1 || welcomePct > 100) {
    return { ok: false as const, error: "El descuento de bienvenida debe ser entre 1 y 100." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false as const, error: "Falta configuración del servidor (Supabase)." };
  }

  const { error } = await admin
    .from("platform_settings")
    .update({
      admin_alert_email: rawEmail || null,
      alert_on_user_signup: signup,
      alert_on_subscription_payment: payment,
      welcome_promo_enabled: welcomePromo,
      welcome_promo_discount_percent: welcomePct,
      welcome_promo_plan_key: planKey,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/admin/alertas");
  return { ok: true as const };
}

export const saveAdminAlertSettings = createMonitoredAction(saveAdminAlertSettingsImpl, "admin/saveAlertSettings");
