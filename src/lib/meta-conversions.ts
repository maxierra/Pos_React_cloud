import "server-only";

import { createHash } from "node:crypto";

const DEFAULT_PIXEL_ID = "3436082476553759";
const DEFAULT_GRAPH_VERSION = "v26.0";

type MetaPurchase = {
  eventId: string;
  eventTime: number;
  value: number;
  currency: string;
  email: string;
  phone: string;
  customerName: string;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  fbc?: string | null;
  fbp?: string | null;
  sourceUrl: string;
  productSku: string;
};

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function normalizeArgentinaPhone(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^0+/, "");
  return digits.startsWith("54") ? digits : `54${digits}`;
}

export async function sendMetaPurchase(input: MetaPurchase): Promise<{ ok: true } | { ok: false; error: string }> {
  const accessToken = (process.env.META_CONVERSIONS_API_TOKEN ?? "").trim();
  const pixelId = (process.env.META_PIXEL_ID ?? process.env.NEXT_PUBLIC_META_PIXEL_ID ?? DEFAULT_PIXEL_ID).trim();
  if (!accessToken) return { ok: false, error: "META_CONVERSIONS_API_TOKEN no configurado" };
  if (!pixelId) return { ok: false, error: "META_PIXEL_ID no configurado" };

  const parts = input.customerName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() ?? "";
  const lastName = parts.join("");
  const userData: Record<string, string | string[]> = {
    em: [hash(input.email.trim().toLowerCase())],
    ph: [hash(normalizeArgentinaPhone(input.phone))],
    country: [hash("ar")],
  };
  if (firstName) userData.fn = [hash(normalizeName(firstName))];
  if (lastName) userData.ln = [hash(normalizeName(lastName))];
  if (input.clientIp) userData.client_ip_address = input.clientIp;
  if (input.clientUserAgent) userData.client_user_agent = input.clientUserAgent;
  if (input.fbc) userData.fbc = input.fbc;
  if (input.fbp) userData.fbp = input.fbp;

  const graphVersion = (process.env.META_GRAPH_API_VERSION ?? DEFAULT_GRAPH_VERSION).trim();
  const endpoint = `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`;
  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: input.eventTime,
        event_id: input.eventId,
        action_source: "website",
        event_source_url: input.sourceUrl,
        user_data: userData,
        custom_data: {
          value: input.value,
          currency: input.currency,
          content_name: "Tienda360",
          content_ids: [input.productSku],
          content_type: "product",
          order_id: input.eventId,
        },
      },
    ],
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const result = (await response.json().catch(() => null)) as { events_received?: number; error?: { message?: string } } | null;
    if (!response.ok || !result?.events_received) {
      return { ok: false, error: result?.error?.message ?? `Meta respondió ${response.status}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Error de red al enviar a Meta" };
  }
}
