"use server";

import { createMonitoredAction } from "@/lib/action-wrapper";
import { createClient } from "@/lib/supabase/server";

async function getMercadoPagoPosCheckoutStatusImpl(externalReference: string) {
  const ref = String(externalReference ?? "").trim();
  if (!ref) {
    return { error: "Falta referencia" as const };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_mercadopago_pos_checkout_status", {
    p_external_reference: ref,
  });
  if (error) {
    return { error: error.message };
  }
  const row = data as { status?: string; sale_id?: string } | null;
  const status = String(row?.status ?? "");
  if (status === "paid" && row?.sale_id) {
    return { status: "paid" as const, saleId: String(row.sale_id) };
  }
  if (status === "pending") {
    return { status: "pending" as const };
  }
  if (status === "cancelled") {
    return { status: "cancelled" as const };
  }
  return { status: "not_found" as const };
}

export const getMercadoPagoPosCheckoutStatus = createMonitoredAction(
  getMercadoPagoPosCheckoutStatusImpl,
  "pos/getMercadoPagoPosCheckoutStatus"
);

async function cancelMercadoPagoPosCheckoutImpl(externalReference: string) {
  const ref = String(externalReference ?? "").trim();
  if (!ref) {
    return { error: "Falta referencia" as const };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_mercadopago_pos_checkout", {
    p_external_reference: ref,
  });
  if (error) {
    return { error: error.message };
  }
  return { ok: data === true };
}

export const cancelMercadoPagoPosCheckout = createMonitoredAction(
  cancelMercadoPagoPosCheckoutImpl,
  "pos/cancelMercadoPagoPosCheckout"
);
