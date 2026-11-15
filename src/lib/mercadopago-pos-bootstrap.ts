import { randomBytes } from "crypto";

export type MercadoPagoPosBootstrapResult = {
  mpUserId: string;
  nickname: string | null;
  storeId: number;
  storeExternalId: string;
  posNumericId: number;
  posExternalId: string;
  qrImageUrl: string | null;
  qrTemplateImageUrl: string | null;
  qrTemplateDocumentUrl: string | null;
  qrCode: string;
};

function extractMpMessage(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const cause = o.cause;
  if (typeof cause === "string" && cause.trim()) return cause.trim();
  if (Array.isArray(cause) && cause[0] && typeof cause[0] === "object") {
    const firstCause = cause[0] as { message?: string; detail?: string; description?: string; code?: string };
    const causeText = firstCause.message ?? firstCause.detail ?? firstCause.description ?? firstCause.code;
    if (typeof causeText === "string" && causeText.trim()) return causeText.trim();
  }
  const errors = o.errors;
  if (typeof errors === "string" && errors.trim()) return errors.trim();
  if (Array.isArray(errors) && errors[0] && typeof errors[0] === "object") {
    const firstError = errors[0] as { message?: string; detail?: string; description?: string };
    const m = firstError.message ?? firstError.detail ?? firstError.description;
    if (typeof m === "string" && m.trim()) return m.trim();
  }
  const error = o.error;
  if (typeof error === "string" && error.trim()) return error.trim();
  const detail = o.detail;
  if (typeof detail === "string" && detail.trim()) return detail.trim();
  const description = o.description;
  if (typeof description === "string" && description.trim()) return description.trim();
  if (typeof o.message === "string" && o.message.trim()) return o.message.trim();
  return null;
}

/**
 * Crea sucursal + caja (POS) en la cuenta del vendedor asociada al access token.
 * Store + POST /v2/pos en modo PDV. La respuesta incluye el QR fijo imprimible.
 */
export async function mercadoPagoBootstrapStoreAndPos(
  accessToken: string
): Promise<MercadoPagoPosBootstrapResult> {
  const token = accessToken.trim().replace(/[\r\n]+/g, "");
  if (!token) {
    throw new Error("El access token está vacío");
  }

  const meRes = await fetch("https://api.mercadopago.com/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meJson = (await meRes.json().catch(() => ({}))) as {
    id?: number | string;
    nickname?: string;
  };
  if (!meRes.ok) {
    throw new Error(extractMpMessage(meJson) || `Token inválido (${meRes.status})`);
  }
  const userId = String(meJson.id ?? "").trim();
  if (!userId) {
    throw new Error("Mercado Pago no devolvió el usuario (users/me)");
  }

  const randStore = randomBytes(4).toString("hex").toUpperCase();
  const randPos = randomBytes(5).toString("hex").toUpperCase();
  const storeExternalId = `STR${randStore}`;
  const posExternalId = `POS${randPos}`;

  const storeBody = {
    name: `Sucursal ${storeExternalId}`,
    external_id: storeExternalId,
    location: {
      street_number: "1",
      street_name: "S/N",
      city_name: "Avellaneda",
      state_name: "Buenos Aires",
      zip_code: "1870",
      latitude: -34.6637,
      longitude: -58.3653,
      reference: "Alta automática desde POS",
    },
  };

  const storeRes = await fetch(`https://api.mercadopago.com/users/${userId}/stores`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(storeBody),
  });
  const storeData = (await storeRes.json().catch(() => ({}))) as {
    id?: number | string;
    external_id?: string;
  };
  if (!storeRes.ok) {
    throw new Error(extractMpMessage(storeData) || `No se pudo crear la sucursal (${storeRes.status})`);
  }
  const storeId = Number(storeData.id);
  if (!Number.isFinite(storeId)) {
    throw new Error("Mercado Pago no devolvió el store_id numérico");
  }

  const posBody = {
    name: `Caja ${posExternalId}`,
    external_id: posExternalId,
    // El schema vigente de /v2/pos declara store_id como string.
    store_id: String(storeId),
    config: {
      qr: {
        operating_mode: "pdv",
      },
    },
  };

  const posRes = await fetch("https://api.mercadopago.com/v2/pos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": randomBytes(16).toString("hex"),
    },
    body: JSON.stringify(posBody),
  });
  const posData = (await posRes.json().catch(() => ({}))) as {
    id?: number;
    qr_response?: {
      image?: string;
      template_image?: string;
      template_document?: string;
      qr_code?: string;
    };
  };
  if (!posRes.ok) {
    throw new Error(extractMpMessage(posData) || `No se pudo crear la caja (${posRes.status})`);
  }
  const posNumericId = Number(posData.id);
  if (!Number.isFinite(posNumericId)) {
    throw new Error("Mercado Pago no devolvió el id de la caja");
  }
  const qrCode = String(posData.qr_response?.qr_code ?? "").trim();
  if (!qrCode) {
    throw new Error("Mercado Pago creó la caja pero no devolvió el QR fijo");
  }

  return {
    mpUserId: userId,
    nickname: meJson.nickname != null ? String(meJson.nickname) : null,
    storeId,
    storeExternalId,
    posNumericId,
    posExternalId,
    qrImageUrl: String(posData.qr_response?.image ?? "").trim() || null,
    qrTemplateImageUrl: String(posData.qr_response?.template_image ?? "").trim() || null,
    qrTemplateDocumentUrl: String(posData.qr_response?.template_document ?? "").trim() || null,
    qrCode,
  };
}
