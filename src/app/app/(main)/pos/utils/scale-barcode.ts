export type ParsedScaleBarcode = {
  scaleCode: string;
  weightKg: number;
};

function round3(n: number) {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

/**
 * Heurística de etiquetas de balanza (Argentina):
 * - EAN-13 que empieza con 20-29
 * - Formato asumido: PP + CCCCC + WWWWW + X
 *   - CCCCC: código de artículo (scale_code)
 *   - WWWWW: peso en gramos (0..99999)
 *
 * Ej: 20 00201 00200 3 => scale_code=00201, weight=200g => 0.200kg
 */
export function parseScaleBarcode(raw: string): ParsedScaleBarcode | null {
  const code = String(raw ?? "").trim();
  if (!/^\d{13}$/.test(code)) return null;

  const prefix = Number(code.slice(0, 2));
  if (!Number.isFinite(prefix) || prefix < 20 || prefix > 29) return null;

  const scaleCode = code.slice(2, 7);
  const gramsRaw = code.slice(7, 12);

  const grams = Number(gramsRaw);
  if (!Number.isFinite(grams) || grams <= 0) return null;

  return {
    scaleCode,
    weightKg: round3(grams / 1000),
  };
}
