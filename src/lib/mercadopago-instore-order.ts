const MP_ORDERS_URL = "https://api.mercadopago.com/v1/orders";

function sanitizeExternalRef(ref: string, max = 64): string {
  const cleaned = ref.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, max);
  return cleaned || `pos-${Date.now()}`;
}

export type MercadoPagoQrOrderResult =
  | { ok: true; qr_data: string; order_id?: string }
  | { ok: false; message: string; status?: number };

function mpOrdersErrorsDetail(json: Record<string, unknown>): string {
  const errs = json.errors;
  if (!Array.isArray(errs) || errs.length === 0) return "";
  const parts: string[] = [];
  for (const e of errs) {
    if (!e || typeof e !== "object") continue;
    const o = e as Record<string, unknown>;
    const field = typeof o.field === "string" ? o.field : "";
    const code = typeof o.code === "string" ? o.code : "";
    const msg = typeof o.message === "string" ? o.message : "";
    const det = o.details;
    const detailStr =
      Array.isArray(det) && det.length > 0
        ? det.filter((x): x is string => typeof x === "string").join("; ")
        : "";
    const line = [field, code, msg].filter(Boolean).join(" · ");
    const combined = line && detailStr ? `${line} — ${detailStr}` : line || detailStr;
    if (combined) parts.push(combined);
  }
  return parts.join(" | ");
}

/**
 * Crea una orden QR modelo dinámico (Mercado Pago AR).
 * Requiere access token de producción del vendedor y external_pos_id de la caja MP.
 */
export async function createMercadoPagoDynamicQrOrder(input: {
  accessToken: string;
  externalPosId: string;
  amountArs: number;
  description: string;
  externalReference: string;
  idempotencyKey: string;
}): Promise<MercadoPagoQrOrderResult> {
  const amount = Math.round((input.amountArs + Number.EPSILON) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: "Monto inválido" };
  }

  const token = input.accessToken.trim();
  const posId = input.externalPosId.trim();
  if (!token || !posId) {
    return { ok: false, message: "Falta token o ID de caja Mercado Pago" };
  }

  const totalStr = amount.toFixed(2);
  const desc = (input.description || "Venta").trim().slice(0, 150);
  const extRef = sanitizeExternalRef(input.externalReference);

  const body = {
    type: "qr",
    total_amount: totalStr,
    description: desc,
    external_reference: extRef,
    expiration_time: "PT16M",
    config: {
      qr: {
        external_pos_id: posId,
        mode: "dynamic",
      },
    },
    transactions: {
      payments: [{ amount: totalStr }],
    },
  };

  const res = await fetch(MP_ORDERS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    const msg =
      (typeof json.message === "string" && json.message) ||
      (typeof (json as { error?: string }).error === "string" && (json as { error: string }).error) ||
      `Mercado Pago (${res.status})`;
    const cause = (json as { cause?: string }).cause;
    const errDetail = mpOrdersErrorsDetail(json);
    const finalMsg = errDetail
      ? `${msg}: ${errDetail}`
      : cause
        ? `${msg} (${cause})`
        : msg;
    console.warn("[mp-qr] POST /v1/orders falló", {
      http_status: res.status,
      external_pos_id: posId,
      message: finalMsg,
      mp_body_keys: json && typeof json === "object" ? Object.keys(json) : [],
    });
    if (process.env.NODE_ENV === "development") {
      console.warn("[mp-qr] respuesta MP (completa)", JSON.stringify(json, null, 2));
    }
    return {
      ok: false,
      message: finalMsg,
      status: res.status,
    };
  }

  const typeResponse = json.type_response as { qr_data?: string } | undefined;
  const qr_data = typeResponse?.qr_data?.trim();
  if (!qr_data) {
    return {
      ok: false,
      message: "Mercado Pago no devolvió datos de QR. Revisá el ID de caja y las credenciales.",
      status: res.status,
    };
  }

  const order_id = typeof json.id === "string" ? json.id : undefined;
  return { ok: true, qr_data, order_id };
}
