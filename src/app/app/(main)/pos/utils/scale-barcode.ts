export type ParsedScaleBarcode = {
  scaleCode: string;
  value: number;
  mode: "weight" | "price";
};

function round3(n: number) {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Etiquetas de balanza (Argentina):
 * - EAN-13 que empieza con 20-29
 * - Formato: PP + CCCCC + VVVVV + X
 *   - CCCCC: codigo de articulo (scale_code)
 *   - VVVVV: peso en gramos o importe, segun configuracion
 */
export function parseScaleBarcode(raw: string, mode: "weight" | "price" = "weight"): ParsedScaleBarcode | null {
  const code = String(raw ?? "").trim();
  if (!/^\d{13}$/.test(code)) return null;

  const prefix = Number(code.slice(0, 2));
  if (!Number.isFinite(prefix) || prefix < 20 || prefix > 29) return null;

  const scaleCode = code.slice(2, 7);
  const encodedValue = Number(code.slice(7, 12));
  if (!Number.isFinite(encodedValue) || encodedValue <= 0) return null;

  return {
    scaleCode,
    value: mode === "weight" ? round3(encodedValue / 1000) : round2(encodedValue),
    mode,
  };
}
