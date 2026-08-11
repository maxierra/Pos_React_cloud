"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type ComboReservationInput = {
  comboSku: string;
  comboTitle: string;
  customerName: string;
  shippingAddress: string;
  phone: string;
  paymentMethod: "mercadopago" | "transferencia" | "efectivo" | "a_coordinar";
  notes?: string;
};

export async function createComboReservation(
  input: ComboReservationInput
): Promise<{ ok: true } | { error: string }> {
  const customerName = input.customerName.trim();
  const shippingAddress = input.shippingAddress.trim();
  const phone = input.phone.trim();
  const notes = input.notes?.trim() ?? "";

  if (!customerName) return { error: "Ingresá el nombre completo." };
  if (!shippingAddress) return { error: "Ingresá la dirección exacta." };
  if (!phone) return { error: "Ingresá el teléfono o WhatsApp." };
  if (!input.comboSku.trim() || !input.comboTitle.trim()) return { error: "Combo inválido." };

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("combo_reservations").insert({
      combo_sku: input.comboSku.trim(),
      combo_title: input.comboTitle.trim(),
      customer_name: customerName,
      shipping_address: shippingAddress,
      phone,
      payment_method: input.paymentMethod,
      notes: notes || null,
    });

    if (error) return { error: error.message };
    return { ok: true };
  } catch {
    return { error: "No se pudo guardar la reserva." };
  }
}
