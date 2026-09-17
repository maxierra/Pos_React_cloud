"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { assertSettingsOwner } from "@/app/app/(main)/settings/actions";
import type { BusinessPaymentMethodRow } from "@/lib/business-payment-methods";

export type PaymentMethodPayload = {
  id: string;
  label: string;
  icon_key: string;
  icon_url: string;
  is_active: boolean;
  sort_order: number;
};

export async function createPaymentMethod(input: {
  label: string;
  icon_key: string;
}): Promise<{ row?: BusinessPaymentMethodRow; error?: string }> {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;
  if (!businessId) return { error: "No hay negocio activo" };

  try {
    await assertSettingsOwner(businessId);
  } catch {
    return { error: "Solo el dueño puede agregar medios de pago." };
  }

  const label = String(input.label ?? "").trim();
  if (!label) return { error: "Ingresá un nombre para el medio de pago." };
  if (label.length > 60) return { error: "El nombre puede tener hasta 60 caracteres." };

  const baseCode = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 36) || "medio_pago";

  const supabase = await createClient();
  const { data: existing, error: listError } = await supabase
    .from("business_payment_methods")
    .select("method_code, sort_order")
    .eq("business_id", businessId);
  if (listError) return { error: listError.message };

  const usedCodes = new Set((existing ?? []).map((row) => String(row.method_code)));
  let methodCode = baseCode;
  let suffix = 2;
  while (usedCodes.has(methodCode)) {
    methodCode = `${baseCode.slice(0, 32)}_${suffix}`;
    suffix += 1;
  }
  const nextOrder = Math.max(-1, ...(existing ?? []).map((row) => Number(row.sort_order) || 0)) + 1;

  const { data, error } = await supabase
    .from("business_payment_methods")
    .insert({
      business_id: businessId,
      method_code: methodCode,
      label,
      icon_key: String(input.icon_key ?? "wallet").trim() || "wallet",
      icon_url: null,
      is_active: true,
      sort_order: nextOrder,
    })
    .select("id, business_id, method_code, label, icon_key, icon_url, is_active, sort_order")
    .single();

  if (error || !data) return { error: error?.message ?? "No se pudo crear el medio de pago." };

  revalidatePath("/app/settings");
  revalidatePath("/app/pos");
  return { row: data as BusinessPaymentMethodRow };
}

export async function ensurePaymentMethods(): Promise<{ error?: string }> {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;
  if (!businessId) return { error: "No hay negocio activo" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("ensure_business_payment_methods", {
    p_business_id: businessId,
  });
  if (error) return { error: error.message };
  return {};
}

export async function savePaymentMethods(rows: PaymentMethodPayload[]): Promise<{ error?: string }> {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;
  if (!businessId) return { error: "No hay negocio activo" };

  try {
    await assertSettingsOwner(businessId);
  } catch {
    return { error: "Solo el dueño puede editar los medios de pago." };
  }

  const supabase = await createClient();

  for (const r of rows) {
    const label = (r.label ?? "").trim();
    if (!label) return { error: "El nombre no puede estar vacío" };

    const icon_url = (r.icon_url ?? "").trim() || null;
    const icon_key = (r.icon_key ?? "banknote").trim() || "banknote";
    const sort_order = Number.isFinite(r.sort_order) ? Math.round(r.sort_order) : 0;

    const { error } = await supabase
      .from("business_payment_methods")
      .update({
        label,
        icon_key,
        icon_url,
        is_active: Boolean(r.is_active),
        sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", r.id)
      .eq("business_id", businessId);

    if (error) return { error: error.message };
  }

  revalidatePath("/app/settings");
  revalidatePath("/app/pos");
  return {};
}

export async function deletePaymentMethod(id: string): Promise<{ error?: string }> {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;
  if (!businessId) return { error: "No hay negocio activo" };

  try {
    await assertSettingsOwner(businessId);
  } catch {
    return { error: "Solo el dueño puede eliminar medios de pago." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("business_payment_methods")
    .delete()
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) return { error: error.message };

  await supabase.rpc("ensure_business_payment_methods", { p_business_id: businessId });

  revalidatePath("/app/settings");
  revalidatePath("/app/pos");
  return {};
}
