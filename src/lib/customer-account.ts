export type SaleSplitPart = {
  method: string;
  amount: number;
};

function toNum(value: unknown) {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function getSaleSplitParts(details: unknown): SaleSplitPart[] {
  if (!details || typeof details !== "object") return [];
  const raw = (details as Record<string, unknown>).split;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      const obj = item as Record<string, unknown>;
      return {
        method: String(obj.method ?? ""),
        amount: toNum(obj.amount),
      };
    })
    .filter((part) => part.method.length > 0 && part.amount > 0);
}

export function saleCuentaCorrienteAmount(params: {
  paymentMethod: string;
  paymentDetails?: unknown;
  total: number | string | null | undefined;
}) {
  const { paymentMethod, paymentDetails, total } = params;
  if (paymentMethod === "cuenta_corriente") return toNum(total);
  if (paymentMethod !== "mixed") return 0;

  return getSaleSplitParts(paymentDetails)
    .filter((part) => part.method === "cuenta_corriente")
    .reduce((sum, part) => sum + part.amount, 0);
}
