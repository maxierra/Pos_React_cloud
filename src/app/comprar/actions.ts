"use server";

import { MercadoPagoConfig, Preference } from "mercadopago";

import { getAppBaseUrl, isLocalAppOrigin } from "@/lib/app-base-url";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getStoreProductBySku,
  getStoreSoftwarePromoConfig,
  normalizeStoreCoupon,
} from "@/lib/store-products";
import { normalizeBusinessType } from "@/lib/business-types";

export type StoreCheckoutInput = {
  sku: string;
  email: string;
  customerName: string;
  phone: string;
  businessName: string;
  businessType: string;
  couponCode?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingProvince?: string;
  shippingPostalCode?: string;
  shippingNotes?: string;
};

function storeSoftwarePromotion(productSku: string, listAmount: number, rawCode?: string | null) {
  const submittedCode = normalizeStoreCoupon(rawCode);
  const config = getStoreSoftwarePromoConfig(listAmount);
  const valid =
    productSku === "software_lifetime" &&
    (!submittedCode || submittedCode === config.code);
  return { submittedCode, configuredCode: config.code, discountPercent: config.discountPercent, valid };
}

export async function validateStoreCoupon(
  sku: string,
  rawCode: string
): Promise<
  | { ok: true; code: string; discountPercent: number; listAmount: number; payAmount: number }
  | { ok: false; error: string }
> {
  const product = await getStoreProductBySku(sku);
  if (!product) return { ok: false, error: "Producto no encontrado." };
  const promotion = storeSoftwarePromotion(product.sku, product.price_ars, rawCode);
  if (!promotion.submittedCode) return { ok: false, error: "Ingresá un código de descuento." };
  if (!promotion.valid) return { ok: false, error: "El código ingresado no es válido." };
  const payAmount = Math.round(product.price_ars * (1 - promotion.discountPercent / 100));
  return {
    ok: true,
    code: promotion.configuredCode,
    discountPercent: promotion.discountPercent,
    listAmount: product.price_ars,
    payAmount,
  };
}

export async function startStoreCheckout(
  input: StoreCheckoutInput
): Promise<{ checkoutUrl: string; orderId: string } | { error: string }> {
  const token = (process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").trim();
  if (!token) {
    return { error: "Pagos no configurados. Contactanos por WhatsApp." };
  }

  const product = await getStoreProductBySku(input.sku);
  if (!product) {
    return { error: "Producto no encontrado." };
  }

  const email = input.email.trim().toLowerCase();
  if (!email) {
    return { error: "Ingresá tu email." };
  }
  if (!email.includes("@")) {
    return { error: "Email inválido." };
  }

  const customerName = input.customerName.trim();
  if (!customerName) {
    return { error: "Ingresá tu nombre completo." };
  }

  const phone = input.phone.trim();
  if (!phone) {
    return { error: "Ingresá tu teléfono o WhatsApp." };
  }

  const businessName = input.businessName.trim();
  if (!businessName) {
    return { error: "Ingresá el nombre de tu negocio." };
  }

  if (product.includes_hardware && customerName.split(/\s+/).filter(Boolean).length < 2) {
    return { error: "Ingresá nombre y apellido completos para el envío." };
  }

  if (product.includes_hardware) {
    if (!input.shippingAddress?.trim()) {
      return { error: "Ingresá la dirección de envío." };
    }
    if (!input.shippingCity?.trim()) {
      return { error: "Ingresá la ciudad." };
    }
    if (!input.shippingProvince?.trim()) {
      return { error: "Ingresá la provincia." };
    }
    if (!input.shippingPostalCode?.trim()) {
      return { error: "Ingresá el código postal." };
    }
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Configuración del servidor incompleta." };
  }

  const { data: existingUserId } = await admin.rpc("get_auth_user_id_by_email", { p_email: email });
  if (existingUserId) {
    return {
      error:
        "Este email ya tiene cuenta. Iniciá sesión o escribinos por WhatsApp si querés comprar otro producto.",
    };
  }

  const businessType = normalizeBusinessType(input.businessType);
  const promotion = storeSoftwarePromotion(product.sku, product.price_ars, input.couponCode);
  if (promotion.submittedCode && !promotion.valid) {
    return { error: "El código de descuento no es válido." };
  }
  const listAmount = product.price_ars;
  const amount = promotion.valid
    ? Math.round(listAmount * (1 - promotion.discountPercent / 100))
    : listAmount;

  const { data: order, error: orderErr } = await admin
    .from("store_orders")
    .insert({
      product_sku: product.sku,
      amount_ars: amount,
      status: "pending_payment",
      email,
      customer_name: customerName,
      phone,
      business_name: businessName,
      business_type: businessType,
      shipping_address: product.includes_hardware ? input.shippingAddress?.trim() ?? null : null,
      shipping_city: product.includes_hardware ? input.shippingCity?.trim() ?? null : null,
      shipping_province: product.includes_hardware ? input.shippingProvince?.trim() ?? null : null,
      shipping_postal_code: product.includes_hardware ? input.shippingPostalCode?.trim() ?? null : null,
      shipping_notes: product.includes_hardware ? input.shippingNotes?.trim() ?? null : null,
      fulfillment_status: product.includes_hardware ? "pending_shipment" : "not_applicable",
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return { error: orderErr?.message ?? "No se pudo crear el pedido." };
  }

  const orderId = (order as { id: string }).id;
  const base = getAppBaseUrl();
  const notificationUrl = `${base}/api/webhooks/mercadopago`;
  const shouldUseAutoReturn = !isLocalAppOrigin(base);
  const currency = (process.env.MERCADOPAGO_PLAN_CURRENCY ?? "ARS").trim().toUpperCase();

  const client = new MercadoPagoConfig({ accessToken: token });
  const preference = new Preference(client);

  const body: {
    items: Array<{
      id: string;
      title: string;
      quantity: number;
      currency_id: string;
      unit_price: number;
    }>;
    external_reference: string;
    metadata: {
      order_type: string;
      product_sku: string;
      store_order_id: string;
      coupon_code: string;
      discount_percent: number;
      list_amount_ars: number;
    };
    notification_url: string;
    back_urls: {
      success: string;
      pending: string;
      failure: string;
    };
    auto_return?: "approved";
  } = {
    items: [
      {
        id: product.sku,
        title: product.name,
        quantity: 1,
        currency_id: currency,
        unit_price: amount,
      },
    ],
    external_reference: orderId,
    metadata: {
      order_type: "store",
      product_sku: product.sku,
      store_order_id: orderId,
      coupon_code: promotion.valid ? promotion.configuredCode : "",
      discount_percent: promotion.valid ? promotion.discountPercent : 0,
      list_amount_ars: listAmount,
    },
    notification_url: notificationUrl,
    back_urls: {
      success: `${base}/comprar/exito?order=${orderId}`,
      pending: `${base}/comprar/exito?order=${orderId}&mp=pending`,
      failure: `${base}/comprar/exito?order=${orderId}&mp=failure`,
    },
  };

  if (shouldUseAutoReturn) {
    body.auto_return = "approved";
  }

  try {
    const res = await preference.create({ body });
    const useSandbox = process.env.MERCADOPAGO_USE_SANDBOX === "1";
    const checkoutUrl = useSandbox ? res.sandbox_init_point : res.init_point;

    if (!checkoutUrl) {
      return { error: "Mercado Pago no devolvió URL de pago." };
    }

    await admin
      .from("store_orders")
      .update({ mp_preference_id: String(res.id ?? ""), updated_at: new Date().toISOString() })
      .eq("id", orderId);

    return { checkoutUrl, orderId };
  } catch (e) {
    console.error("[store-checkout] preference.create failed:", e);
    return { error: e instanceof Error ? e.message : "Error al iniciar el pago." };
  }
}

export async function getStoreOrderStatus(orderId: string): Promise<{
  status: string;
  provisioned: boolean;
  fulfillmentStatus: string;
  email: string | null;
  trackingToken: string | null;
  includesHardware: boolean;
} | null> {
  if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) return null;

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("store_orders")
      .select("status,provisioned_at,fulfillment_status,email,tracking_token,product_sku")
      .eq("id", orderId)
      .maybeSingle();
    if (!data) return null;
    const row = data as {
      status: string;
      provisioned_at: string | null;
      fulfillment_status: string;
      email: string;
      tracking_token: string;
      product_sku: string;
    };

    const { data: product } = await admin
      .from("store_products")
      .select("includes_hardware")
      .eq("sku", row.product_sku)
      .maybeSingle();

    return {
      status: row.status,
      provisioned: Boolean(row.provisioned_at),
      fulfillmentStatus: row.fulfillment_status,
      email: row.email,
      trackingToken: row.tracking_token,
      includesHardware: Boolean((product as { includes_hardware?: boolean } | null)?.includes_hardware),
    };
  } catch {
    return null;
  }
}
