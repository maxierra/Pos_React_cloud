"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { assertSettingsOwner } from "@/app/app/(main)/settings/actions";

export type PaymentMethodPayload = {
  id: string;
  label: string;
  icon_key: string;
  icon_url: string;
  is_active: boolean;
  sort_order: number;
};

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
