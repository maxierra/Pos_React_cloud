export type PosPaymentMethodCode = "cash" | "card" | "transfer" | "mercadopago";

export type BusinessPaymentMethodRow = {
  id: string;
  business_id: string;
  method_code: PosPaymentMethodCode;
  label: string;
  icon_key: string;
  icon_url: string | null;
  is_active: boolean;
  sort_order: number;
};

/** Opciones de ícono (Lucide) para el selector en configuración. */
export const PAYMENT_METHOD_ICON_OPTIONS: { value: string; label: string }[] = [
  { value: "banknote", label: "Billetes (efectivo)" },
  { value: "credit-card", label: "Tarjeta" },
  { value: "landmark", label: "Banco / transferencia" },
  { value: "wallet", label: "Billetera" },
  { value: "smartphone", label: "Celular / QR" },
  { value: "qr-code", label: "Código QR" },
  { value: "circle-dollar-sign", label: "Dólar" },
  { value: "bitcoin", label: "Crypto" },
  { value: "gift", label: "Regalo / cupón" },
  { value: "building-2", label: "Edificio" },
];

export const DEFAULT_PAYMENT_LABELS: Record<PosPaymentMethodCode, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  mercadopago: "Mercado Pago",
};

export function sortPaymentMethods<T extends { sort_order: number; method_code: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.sort_order - b.sort_order || a.method_code.localeCompare(b.method_code));
}

export function buildPaymentLabelMap(rows: BusinessPaymentMethodRow[]): Record<string, string> {
  const map: Record<string, string> = { ...DEFAULT_PAYMENT_LABELS };
  for (const r of rows) {
    map[r.method_code] = r.label;
  }
  return map;
}

export function methodButtonClass(method: PosPaymentMethodCode, selected: boolean): string {
  const base = "h-12 flex flex-col items-center justify-center gap-0.5 text-xs font-medium sm:flex-row sm:gap-1.5 sm:text-sm";
  if (!selected) return base;
  switch (method) {
    case "cash":
      return `${base} bg-[var(--pos-accent)] text-black hover:bg-[color-mix(in_oklab,var(--pos-accent)_90%,black)]`;
    case "card":
      return `${base} bg-[var(--pos-amber)] text-black hover:bg-[color-mix(in_oklab,var(--pos-amber)_90%,black)]`;
    case "transfer":
      return `${base} bg-violet-400 text-black hover:bg-violet-400/90`;
    case "mercadopago":
      return `${base} bg-sky-400 text-black hover:bg-sky-400/90`;
    default:
      return base;
  }
}
