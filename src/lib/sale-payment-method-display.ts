import { isMercadoPagoPosCheckoutExternalReference } from "@/lib/mp-pos-external-ref";

/**
 * Cobros QR MP guardan `mercadopago_payment_id` / `mercadopago_external_reference` en payment_details.
 * Corrige etiquetas y totales si el método quedó mal como "transfer".
 */
export function effectiveSalePaymentMethod(
  payment_method: string,
  payment_details: unknown
): string {
  const m = String(payment_method ?? "");
  if (m === "mixed") return m;
  if (!payment_details || typeof payment_details !== "object") return m;
  const d = payment_details as Record<string, unknown>;
  const mpId = typeof d.mercadopago_payment_id === "string" ? d.mercadopago_payment_id.trim() : "";
  const mpRef =
    typeof d.mercadopago_external_reference === "string" ? d.mercadopago_external_reference.trim() : "";
  const fromMpWebhook = mpId.length > 0 || isMercadoPagoPosCheckoutExternalReference(mpRef);
  if (fromMpWebhook && m === "transfer") {
    return "mercadopago";
  }
  return m;
}
