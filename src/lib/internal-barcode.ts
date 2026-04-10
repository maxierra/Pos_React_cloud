/**
 * EAN-13 interno para productos sin código de fabricante.
 * Prefijo `200` (rango 200–299 reservado para uso en tienda en convención GS1).
 */

const INTERNAL_PREFIX = "200";
const BODY_LEN = 12;

/** Dígito de control EAN-13 para los 12 dígitos de la izquierda (sin el 13.º). */
export function ean13CheckDigit(twelveDigits: string): string {
  if (twelveDigits.length !== BODY_LEN || !/^\d{12}$/.test(twelveDigits)) {
    throw new Error("ean13CheckDigit: se esperaban exactamente 12 dígitos");
  }
  let sum = 0;
  for (let i = 0; i < BODY_LEN; i++) {
    const d = twelveDigits.charCodeAt(i) - 48;
    sum += (i % 2 === 0) ? d : d * 3;
  }
  const mod = sum % 10;
  return mod === 0 ? "0" : String(10 - mod);
}

function randomNineDigits(): string {
  const buf = new Uint32Array(9);
  crypto.getRandomValues(buf);
  let s = "";
  for (let i = 0; i < 9; i++) {
    s += String(buf[i] % 10);
  }
  return s;
}

/** Genera un EAN-13 válido (13 dígitos) para uso interno en el local. */
export function generateInternalEan13(): string {
  const twelve = `${INTERNAL_PREFIX}${randomNineDigits()}`;
  return `${twelve}${ean13CheckDigit(twelve)}`;
}

/**
 * Sugerencias al generar un EAN interno (stock, mínimo, vencimiento lejano).
 * El usuario puede editarlas antes de guardar.
 */
export const INTERNAL_PRODUCT_DEFAULTS = {
  stockUnits: "100",
  lowStockUnits: "50",
  stockKg: "100",
  lowStockKg: "50",
  /** Fecha de vencimiento “larga” para productos sin rotación crítica. */
  expiresAt: "2099-12-31",
} as const;
