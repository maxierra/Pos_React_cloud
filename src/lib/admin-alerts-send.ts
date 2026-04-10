import { createAdminClient } from "@/lib/supabase/admin";
import { parsePlatformAdminEmails } from "@/lib/platform-admin";

export type AdminAlertSettingsRow = {
  admin_alert_email: string | null;
  alert_on_user_signup: boolean;
  alert_on_subscription_payment: boolean;
};

function resendFromAddress(): string {
  const raw = (process.env.RESEND_FROM ?? "").trim();
  if (raw) return raw;
  return "POS <onboarding@resend.dev>";
}

/** Destino: email en BD; si está vacío, primer mail de PLATFORM_ADMIN_EMAILS. */
export function resolveAdminAlertRecipient(settingsEmail: string | null | undefined): string | null {
  const e = (settingsEmail ?? "").trim().toLowerCase();
  if (e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return e;
  const fb = parsePlatformAdminEmails()[0];
  return fb ?? null;
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
    .select("admin_alert_email, alert_on_user_signup, alert_on_subscription_payment")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return null;
  return data as AdminAlertSettingsRow;
}

async function sendWithResend(to: string, subject: string, text: string): Promise<void> {
  const key = (process.env.RESEND_API_KEY ?? "").trim();
  if (!key) {
    console.warn("[admin-alerts] RESEND_API_KEY no configurada; no se envía mail.");
    return;
  }
  const { Resend } = await import("resend");
  const resend = new Resend(key);
  const result = await resend.emails.send({
    from: resendFromAddress(),
    to: [to],
    subject,
    text,
  });
  if (result.error) {
    console.error("[admin-alerts] Resend:", result.error);
  }
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
    await sendWithResend(
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
    await sendWithResend(
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
