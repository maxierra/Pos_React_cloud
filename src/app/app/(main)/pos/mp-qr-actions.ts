"use server";

import { cookies } from "next/headers";
import { randomUUID } from "crypto";

import { createMonitoredAction } from "@/lib/action-wrapper";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMercadoPagoDynamicQrOrder } from "@/lib/mercadopago-instore-order";
import { buildMercadoPagoPosExternalReference } from "@/lib/mp-pos-external-ref";

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export type MpQrCheckoutItem = {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
};

async function assertBusinessMember(businessId: string) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) {
    throw new Error("not_authenticated");
  }
  const { data, error } = await supabase
    .from("memberships")
    .select("business_id")
    .eq("business_id", businessId)
    .eq("user_id", auth.user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) {
    throw new Error("not_authorized");
  }
}

async function createMercadoPagoPosQrImpl(input: {
  amountArs: number;
  description: string;
  items: MpQrCheckoutItem[];
  payment_method: "cash" | "card" | "transfer" | "mercadopago" | "mixed";
  payment_details?: {
    split?: Array<{ method: "cash" | "card" | "transfer" | "mercadopago"; amount: number }>;
    cash_received?: number;
  };
}) {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;
  if (!businessId) {
    return { error: "No hay negocio activo" };
  }

  try {
    await assertBusinessMember(businessId);
  } catch {
    return { error: "No autorizado" };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Servidor sin credenciales de administración (Supabase)." };
  }

  const { data: biz, error: bizErr } = await admin
    .from("businesses")
    .select("mercadopago_pos_external_id")
    .eq("id", businessId)
    .single();

  if (bizErr || !biz) {
    return { error: "No se pudo cargar el negocio" };
  }

  const rawPos = (biz as { mercadopago_pos_external_id?: string | null }).mercadopago_pos_external_id;
  const posId = String(rawPos ?? "").trim();
  if (!posId) {
    console.warn("[mp-qr] Sin ID de caja en DB (columna vacía o solo espacios)", {
      business_id: businessId,
      raw_mercadopago_pos_external_id: rawPos,
    });
    return { error: "Configurá el ID de caja Mercado Pago en Configuración." };
  }

  const { data: acc, error: accErr } = await admin
    .from("business_mercadopago_access")
    .select("access_token")
    .eq("business_id", businessId)
    .maybeSingle();

  if (accErr) {
    return { error: accErr.message };
  }

  const accessToken = String((acc as { access_token?: string | null } | null)?.access_token ?? "").trim();
  if (!accessToken) {
    return { error: "Configurá el access token de Mercado Pago en Configuración." };
  }

  const items = Array.isArray(input.items) ? input.items : [];
  if (items.length === 0) {
    return { error: "La venta no tiene ítems" };
  }
  const sumLines = round2(
    items.reduce((acc, it) => acc + round2(Number(it.quantity) || 0) * round2(Number(it.unit_price) || 0), 0)
  );
  if (Math.abs(sumLines - round2(input.amountArs)) > 0.02) {
    return { error: "El monto con Mercado Pago no coincide con el total de la venta" };
  }

  /** Mínimo que devuelve MP en órdenes QR dinámicas (AR): "Amount must be greater than or equal to 15.00". */
  const MP_QR_MIN_ARS = 15;
  if (round2(input.amountArs) + 1e-9 < MP_QR_MIN_ARS) {
    return {
      error: `Mercado Pago exige al menos $${MP_QR_MIN_ARS} para cobrar con QR. Aumentá el total de la venta.`,
    };
  }

  let externalReference: string;
  try {
    externalReference = buildMercadoPagoPosExternalReference(businessId);
  } catch {
    return { error: "No se pudo generar la referencia de cobro" };
  }

  const expiresAt = new Date(Date.now() + 45 * 60 * 1000).toISOString();
  const { error: pendErr } = await admin.from("mercado_pago_pos_pending_sales").insert({
    business_id: businessId,
    external_reference: externalReference,
    items: items.map((it) => ({
      product_id: it.product_id,
      name: it.name,
      quantity: it.quantity,
      unit_price: it.unit_price,
    })),
    payment_method: input.payment_method,
    payment_details: (input.payment_details as Record<string, unknown> | undefined) ?? null,
    expected_total: round2(input.amountArs),
    expires_at: expiresAt,
    status: "pending",
  });

  if (pendErr) {
    console.error("[mp-qr] pending insert", pendErr);
    return { error: pendErr.message ?? "No se pudo iniciar el cobro" };
  }

  const idempotencyKey = randomUUID();

  const tokenTail = accessToken.length > 8 ? accessToken.slice(-8) : "****";
  console.info("[mp-qr] Llamando a Mercado Pago /v1/orders (QR dinámico)", {
    business_id: businessId,
    external_pos_id: posId,
    external_pos_id_length: posId.length,
    amount_ars: input.amountArs,
    token_suffix: `…${tokenTail}`,
  });

  const result = await createMercadoPagoDynamicQrOrder({
    accessToken,
    externalPosId: posId,
    amountArs: input.amountArs,
    description: input.description,
    externalReference,
    idempotencyKey,
  });

  if (!result.ok) {
    await admin.from("mercado_pago_pos_pending_sales").delete().eq("external_reference", externalReference);
    console.warn("[mp-qr] Mercado Pago respondió error", {
      business_id: businessId,
      external_pos_id: posId,
      status: result.status,
      message: result.message,
    });
    let message = result.message;
    if (process.env.NODE_ENV === "development") {
      message += ` [dev] external_pos_id: "${posId}". 404 = caja inexistente para este token. 400 "Invalid value" = a menudo la caja fue creada sin fixed_amount; en Configuración → Mercado Pago QR usá "Crear sucursal y caja automáticamente" de nuevo para regenerar la caja.`;
    }
    return { error: message };
  }

  if (result.order_id) {
    await admin
      .from("mercado_pago_pos_pending_sales")
      .update({ mp_order_id: result.order_id })
      .eq("external_reference", externalReference);
  }

  return {
    qr_data: result.qr_data,
    order_id: result.order_id,
    external_reference: externalReference,
  };
}

export const createMercadoPagoPosQr = createMonitoredAction(
  createMercadoPagoPosQrImpl,
  "pos/createMercadoPagoPosQr"
);
