/** Código alfanumérico legible para cupones de suscripción. */
export function randomSubscriptionPromoCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  let s = "";
  for (let i = 0; i < 10; i++) {
    s += alphabet[bytes[i] % alphabet.length];
  }
  return s;
}
