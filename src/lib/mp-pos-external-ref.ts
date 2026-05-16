import { randomBytes } from "crypto";

const POS_REF_RE =
  /^p([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-([0-9a-f]{8})$/i;

/** Mercado Pago external_reference max 64 chars; only safe alphanumerics + hyphen. */
export function buildMercadoPagoPosExternalReference(businessId: string): string {
  const id = businessId.trim().toLowerCase();
  const suffix = randomBytes(4).toString("hex");
  const ref = `p${id}-${suffix}`;
  if (ref.length > 64) {
    throw new Error("external_reference too long");
  }
  return ref;
}

export function isMercadoPagoPosCheckoutExternalReference(ref: string): boolean {
  return POS_REF_RE.test(String(ref ?? "").trim());
}
