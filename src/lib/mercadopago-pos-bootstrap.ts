import { randomBytes } from "crypto";

export type MercadoPagoPosBootstrapResult = {
  mpUserId: string;
  nickname: string | null;
  storeId: number;
  storeExternalId: string;
  posNumericId: number;
  posExternalId: string;
};

function extractMpMessage(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  if (typeof o.message === "string" && o.message.trim()) return o.message.trim();
  const cause = o.cause;
  if (typeof cause === "string" && cause.trim()) return cause.trim();
  const errors = o.errors;
  if (Array.isArray(errors) && errors[0] && typeof errors[0] === "object") {
    const m = (errors[0] as { message?: string }).message;
    if (typeof m === "string" && m.trim()) return m.trim();
  }
  return null;
}

/**
 * Crea sucursal + caja (POS) en la cuenta del vendedor asociada al access token.
 * Store + POST /pos con store_id, fixed_amount true (QR integrado), sin external_store_id en el body.
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

  // fixed_amount: true es obligatorio para modelo integrado (QR por orden / monto desde el POS).
  // Sin esto, POST /v1/orders en modo dynamic suele responder 400 "Invalid value for property".
  // No enviamos external_store_id: en varias cuentas falla con "External store id does not refer any store".
  const posBody = {
    name: `Caja ${posExternalId}`,
    external_id: posExternalId,
    store_id: storeId,
    category: 621102,
    fixed_amount: true,
  };

  const posRes = await fetch("https://api.mercadopago.com/pos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(posBody),
  });
  const posData = (await posRes.json().catch(() => ({}))) as { id?: number };
  if (!posRes.ok) {
    throw new Error(extractMpMessage(posData) || `No se pudo crear la caja (${posRes.status})`);
  }
  const posNumericId = Number(posData.id);
  if (!Number.isFinite(posNumericId)) {
    throw new Error("Mercado Pago no devolvió el id de la caja");
  }

  return {
    mpUserId: userId,
    nickname: meJson.nickname != null ? String(meJson.nickname) : null,
    storeId,
    storeExternalId,
    posNumericId,
    posExternalId,
  };
}
