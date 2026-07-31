export type ScaleBarcodeMode = "weight" | "price" | "both";

export function normalizeScaleCode(input: string | null | undefined): string | null {
  const digits = String(input ?? "").replace(/\D+/g, "").trim();
  if (!digits) return null;
  if (digits.length >= 5) return digits.slice(-5);
  return digits.padStart(5, "0");
}
