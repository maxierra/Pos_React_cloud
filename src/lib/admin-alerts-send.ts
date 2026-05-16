import { createAdminClient } from "@/lib/supabase/admin";
import { parsePlatformAdminEmails } from "@/lib/platform-admin";
import { sendTransactionalEmail } from "@/lib/resend-server";

export type AdminAlertSettingsRow = {
  admin_alert_email: string | null;
  alert_on_user_signup: boolean;
  alert_on_subscription_payment: boolean;
  welcome_promo_enabled: boolean;
  welcome_promo_discount_percent: number;
  welcome_promo_plan_key: "monthly" | "semester" | "annual";
};

/** Destino: email en BD; si está vacío, primer mail de PLATFORM_ADMIN_EMAILS. */
export function resolveAdminAlertRecipient(settingsEmail: string | null | undefined): string | null {
  const e = (settingsEmail ?? "").trim().toLowerCase();
  if (e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return e;
  const fb = parsePlatformAdminEmails()[0];
  return fb ?? null;
}

export function parseAlertSettingsRow(data: Record<string, unknown>): AdminAlertSettingsRow {
  const plan = String(data.welcome_promo_plan_key ?? "monthly");
  return {
    admin_alert_email: (data.admin_alert_email as string | null) ?? null,
    alert_on_user_signup: Boolean(data.alert_on_user_signup),
    alert_on_subscription_payment: Boolean(data.alert_on_subscription_payment),
    welcome_promo_enabled: Boolean(data.welcome_promo_enabled),
    welcome_promo_discount_percent: Math.min(100, Math.max(1, Number(data.welcome_promo_discount_percent ?? 50))),
    welcome_promo_plan_key: plan === "semester" || plan === "annual" ? plan : "monthly",
  };
}

async function loadAlertSettings(): Promise<AdminAlertSettingsRow | null> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return null;
  }
  const { data, error } = await admin
    .from("platform_settings")
    .select(
      "admin_alert_email, alert_on_user_signup, alert_on_subscription_payment, welcome_promo_enabled, welcome_promo_discount_percent, welcome_promo_plan_key"
    )
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return null;
  return parseAlertSettingsRow(data as Record<string, unknown>);
}

/** Nuevo registro (cuenta). No bloquea si falla. */
export async function notifyAdminUserSignup(newUserEmail: string): Promise<void> {
  try {
    const settings = await loadAlertSettings();
    if (!settings?.alert_on_user_signup) return;
    const to = resolveAdminAlertRecipient(settings.admin_alert_email);
    if (!to) {
      console.warn("[admin-alerts] Sin destino: configurá admin_alert_email o PLATFORM_ADMIN_EMAILS.");
      return;
    }
    const safe = newUserEmail.trim();
    await sendTransactionalEmail(
      to,
      `[POS] Nuevo registro: ${safe}`,
      `Se registró un usuario en la plataforma.\n\nEmail: ${safe}\n\n— Alerta automática (registro)`
    );
  } catch (e) {
    console.warn("[admin-alerts] notifyAdminUserSignup", e);
  }
}

/** Pago de suscripción aprobado por Mercado Pago (webhook). */
export async function notifyAdminSubscriptionPayment(input: {
  businessId: string;
  businessName: string;
  amount: number;
  currency: string;
  mpPaymentId: string;
}): Promise<void> {
  try {
    const settings = await loadAlertSettings();
    if (!settings?.alert_on_subscription_payment) return;
    const to = resolveAdminAlertRecipient(settings.admin_alert_email);
    if (!to) {
      console.warn("[admin-alerts] Sin destino: configurá admin_alert_email o PLATFORM_ADMIN_EMAILS.");
      return;
    }
    const { businessId, businessName, amount, currency, mpPaymentId } = input;
    await sendTransactionalEmail(
      to,
      `[POS] Pago de suscripción — ${businessName}`,
      [
        "Mercado Pago acreditó un pago de suscripción.",
        "",
        `Negocio: ${businessName}`,
        `ID negocio: ${businessId}`,
        `Importe: ${amount} ${currency}`,
        `ID pago MP: ${mpPaymentId}`,
        "",
        "— Alerta automática (suscripción)",
      ].join("\n")
    );
  } catch (e) {
    console.warn("[admin-alerts] notifyAdminSubscriptionPayment", e);
  }
}
