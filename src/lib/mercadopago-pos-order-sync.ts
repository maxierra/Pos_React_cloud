import { isMercadoPagoPosCheckoutExternalReference } from "@/lib/mp-pos-external-ref";

const ORDERS_BASE = "https://api.mercadopago.com/v1/orders";

export type MercadoPagoPosOrderCompletion = {
  external_reference: string;
  mp_payment_id: string;
  amount: number;
  currency: string;
};

export async function fetchMercadoPagoOrderWithTokens(
  orderId: string,
  tokens: string[]
): Promise<Record<string, unknown> | null> {
  const id = orderId.trim();
  if (!id) return null;
  for (const token of tokens) {
    const t = token.trim();
    if (!t) continue;
    try {
      const res = await fetch(`${ORDERS_BASE}/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${t}`, Accept: "application/json" },
      });
      if (res.ok) return (await res.json()) as Record<string, unknown>;
    } catch {
      /* probar siguiente token */
    }
  }
  return null;
}

/**
 * Cuando la orden QR está acreditada: external_reference tipo p{uuid}-{hex} y pago en transactions.
 */
export function extractPosCompletionFromOrderJson(
  json: Record<string, unknown>
): MercadoPagoPosOrderCompletion | null {
  if (String(json.status ?? "").toLowerCase() !== "processed") return null;
  const extRef = String(json.external_reference ?? "").trim();
  if (!isMercadoPagoPosCheckoutExternalReference(extRef)) return null;
  const txs = json.transactions as Record<string, unknown> | undefined;
  const payments = txs?.payments;
  if (!Array.isArray(payments) || payments.length === 0) return null;
  const p0 = payments[0] as Record<string, unknown>;
  const payId = String(p0.id ?? "").trim();
  if (!payId) return null;
  const rawPaid = p0.paid_amount ?? p0.amount ?? json.total_paid_amount ?? json.total_amount;
  const amount =
    typeof rawPaid === "string"
      ? Number(rawPaid)
      : typeof rawPaid === "number"
        ? rawPaid
        : NaN;
  if (!Number.isFinite(amount)) return null;
  const currency = String(json.currency ?? "ARS").trim() || "ARS";
  return { external_reference: extRef, mp_payment_id: payId, amount, currency };
}
