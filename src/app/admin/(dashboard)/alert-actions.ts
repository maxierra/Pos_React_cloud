"use server";

import { revalidatePath } from "next/cache";

import { createMonitoredAction } from "@/lib/action-wrapper";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformAdminSessionEmail } from "@/lib/platform-admin-session";
import type { AdminAlertSettingsRow } from "@/lib/admin-alerts-send";

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
    };
  }

  const { data, error } = await admin
    .from("platform_settings")
    .select("admin_alert_email, alert_on_user_signup, alert_on_subscription_payment")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return {
      admin_alert_email: null,
      alert_on_user_signup: false,
      alert_on_subscription_payment: false,
    };
  }
  return data as AdminAlertSettingsRow;
}

async function saveAdminAlertSettingsImpl(formData: FormData) {
  const adminEmail = await getPlatformAdminSessionEmail();
  if (!adminEmail) {
    return { ok: false as const, error: "No autorizado." };
  }

  const rawEmail = String(formData.get("admin_alert_email") ?? "").trim();
  const signup = formData.get("alert_on_user_signup") === "on";
  const payment = formData.get("alert_on_subscription_payment") === "on";

  if (rawEmail && !EMAIL_RE.test(rawEmail)) {
    return { ok: false as const, error: "El correo de destino no es válido." };
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
