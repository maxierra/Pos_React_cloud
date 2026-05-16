"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { createMonitoredAction } from "@/lib/action-wrapper";
import { assertSettingsOwner } from "@/app/app/(main)/settings/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { mercadoPagoBootstrapStoreAndPos } from "@/lib/mercadopago-pos-bootstrap";

async function saveMercadoPagoPosImpl(formData: FormData) {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;
  if (!businessId) {
    return { error: "No hay negocio activo" };
  }

  await assertSettingsOwner(businessId);

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor para guardar el token de forma segura." };
  }

  const posExternalId = String(formData.get("mercadopago_pos_external_id") ?? "").trim();
  const accessToken = String(formData.get("mercadopago_access_token") ?? "").trim();
  const clearToken = formData.get("clear_mercadopago_token") === "true";

  const { error: bizErr } = await admin
    .from("businesses")
    .update({
      mercadopago_pos_external_id: posExternalId || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);

  if (bizErr) {
    return { error: bizErr.message };
  }

  console.info("[mp-config] Guardado Mercado Pago POS", {
    business_id: businessId,
    mercadopago_pos_external_id: posExternalId || null,
    token_updated: Boolean(accessToken),
    token_cleared: clearToken,
  });

  if (clearToken) {
    const { error: delErr } = await admin.from("business_mercadopago_access").delete().eq("business_id", businessId);
    if (delErr) {
      return { error: delErr.message };
    }
  } else if (accessToken) {
    const { error: upErr } = await admin.from("business_mercadopago_access").upsert(
      {
        business_id: businessId,
        access_token: accessToken,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "business_id" }
    );
    if (upErr) {
      return { error: upErr.message };
    }
  }

  revalidatePath("/app/settings");
  revalidatePath("/app/pos");
  return { success: true };
}

export const saveMercadoPagoPos = createMonitoredAction(saveMercadoPagoPosImpl, "settings/saveMercadoPagoPos");

async function bootstrapMercadoPagoPosImpl(formData: FormData) {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;
  if (!businessId) {
    return { error: "No hay negocio activo" };
  }

  await assertSettingsOwner(businessId);

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." };
  }

  const accessToken = String(formData.get("mercadopago_access_token") ?? "")
    .trim()
    .replace(/[\r\n]+/g, "");
  if (!accessToken) {
    return { error: "Pegá el access token de producción en el campo de abajo y volvé a intentar." };
  }

  let boot: Awaited<ReturnType<typeof mercadoPagoBootstrapStoreAndPos>>;
  try {
    boot = await mercadoPagoBootstrapStoreAndPos(accessToken);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al contactar Mercado Pago";
    console.warn("[mp-config] bootstrap MP falló", { business_id: businessId, message: msg });
    return { error: msg };
  }

  const { error: bizErr } = await admin
    .from("businesses")
    .update({
      mercadopago_pos_external_id: boot.posExternalId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);

  if (bizErr) {
    return { error: bizErr.message };
  }

  const { error: upErr } = await admin.from("business_mercadopago_access").upsert(
    {
      business_id: businessId,
      access_token: accessToken,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id" }
  );
  if (upErr) {
    return { error: upErr.message };
  }

  console.info("[mp-config] Bootstrap Mercado Pago OK", {
    business_id: businessId,
    pos_external_id: boot.posExternalId,
    store_id: boot.storeId,
    mp_user_id: boot.mpUserId,
  });

  revalidatePath("/app/settings");
  revalidatePath("/app/pos");

  return {
    success: true as const,
    pos_external_id: boot.posExternalId,
    store_id: boot.storeId,
    store_external_id: boot.storeExternalId,
    pos_numeric_id: boot.posNumericId,
    mp_user_id: boot.mpUserId,
    nickname: boot.nickname,
  };
}

export const bootstrapMercadoPagoPos = createMonitoredAction(
  bootstrapMercadoPagoPosImpl,
  "settings/bootstrapMercadoPagoPos"
);
