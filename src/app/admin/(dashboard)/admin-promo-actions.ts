"use server";

import { revalidatePath } from "next/cache";

import { createMonitoredAction } from "@/lib/action-wrapper";
import { normalizeSubscriptionPromoCode } from "@/lib/subscription-promo";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformAdminSessionEmail } from "@/lib/platform-admin-session";

import type { PlanKey } from "@/app/app/subscription/actions";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function randomPromoCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  let s = "";
  for (let i = 0; i < 10; i++) {
    s += alphabet[bytes[i] % alphabet.length];
  }
  return s;
}

export type AdminCreatePromoResult =
  | { ok: true; code: string; businessId: string }
  | { error: "forbidden" | "invalid_uuid" | "not_found" | "config"; message?: string };

async function adminCreateSubscriptionPromoImpl(input: {
  businessId: string;
  discountPercent: number;
  planKey: PlanKey;
  /** YYYY-MM-DD o vacío */
  expiresAtDate?: string | null;
  note?: string | null;
}): Promise<AdminCreatePromoResult> {
  const adminEmail = await getPlatformAdminSessionEmail();
  if (!adminEmail) return { error: "forbidden" };

  const id = input.businessId.trim();
  if (!UUID_RE.test(id)) return { error: "invalid_uuid" };

  const pct = Number(input.discountPercent);
  if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
    return { error: "config", message: "El descuento debe ser entre 0 y 100." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "config", message: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." };
  }

  const { data: biz, error: bErr } = await admin.from("businesses").select("id").eq("id", id).maybeSingle();
  if (bErr) return { error: "config", message: bErr.message };
  if (!biz) return { error: "not_found" };

  const expiresAt =
    input.expiresAtDate?.trim() && /^\d{4}-\d{2}-\d{2}$/.test(input.expiresAtDate.trim())
      ? new Date(`${input.expiresAtDate.trim()}T23:59:59.999Z`).toISOString()
      : null;

  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomPromoCode();
    const { error: insErr } = await admin.from("subscription_promo_codes").insert({
      code,
      business_id: id,
      discount_percent: pct,
      plan_key: input.planKey,
      expires_at: expiresAt,
      note: input.note?.trim() ? input.note.trim() : null,
    });
    if (!insErr) {
      revalidatePath("/admin");
      return { ok: true, code, businessId: id };
    }
    const codePg = (insErr as { code?: string }).code;
    const msg = insErr.message ?? "";
    if (codePg !== "23505" && !msg.includes("duplicate") && !msg.includes("unique")) {
      return { error: "config", message: insErr.message };
    }
  }

  return { error: "config", message: "No se pudo generar un código único. Reintentá." };
}

export const adminCreateSubscriptionPromo = createMonitoredAction(
  adminCreateSubscriptionPromoImpl,
  "admin/createSubscriptionPromo"
);
