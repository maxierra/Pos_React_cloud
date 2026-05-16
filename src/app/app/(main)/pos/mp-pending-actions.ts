"use server";

import { createMonitoredAction } from "@/lib/action-wrapper";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  extractPosCompletionFromOrderJson,
  fetchMercadoPagoOrderWithTokens,
} from "@/lib/mercadopago-pos-order-sync";

/** Si el webhook Order no llegó, consultamos GET /v1/orders con el token del negocio (mismo criterio que el webhook). */
async function trySyncMercadoPagoPosFromOrderApi(externalReference: string): Promise<void> {
  const ref = externalReference.trim();
  if (!ref) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return;
  }

  const { data: pend, error: pe } = await admin
    .from("mercado_pago_pos_pending_sales")
    .select("business_id, mp_order_id, status, external_reference")
    .eq("external_reference", ref)
    .maybeSingle();

  if (pe || !pend || pend.status !== "pending" || !pend.mp_order_id) return;

  const { data: mem } = await supabase
    .from("memberships")
    .select("business_id")
    .eq("business_id", pend.business_id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!mem) return;

  const { data: acc } = await admin
    .from("business_mercadopago_access")
    .select("access_token")
    .eq("business_id", pend.business_id)
    .maybeSingle();
  const token = String((acc as { access_token?: string } | null)?.access_token ?? "").trim();
  if (!token) return;

  const json = await fetchMercadoPagoOrderWithTokens(String(pend.mp_order_id), [token]);
  if (!json) return;
  const completion = extractPosCompletionFromOrderJson(json);
  if (!completion) return;

  const { error: rpcErr } = await admin.rpc("mercadopago_pos_complete_pending", {
    p_external_reference: completion.external_reference,
    p_mp_payment_id: completion.mp_payment_id,
    p_paid_amount: completion.amount,
    p_currency_id: completion.currency,
  });
  if (rpcErr) {
    console.warn("[mp-pos-poll] sync desde orden MP", rpcErr.message);
  }
}

async function getMercadoPagoPosCheckoutStatusImpl(externalReference: string) {
  const ref = String(externalReference ?? "").trim();
  if (!ref) {
    return { error: "Falta referencia" as const };
  }

  await trySyncMercadoPagoPosFromOrderApi(ref);

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
