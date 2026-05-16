export function normalizeSubscriptionPromoCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function roundMoneyArs(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function discountedPlanAmount(listAmount: number, discountPercent: number): number {
  const p = Math.min(100, Math.max(0, discountPercent));
  return roundMoneyArs(listAmount * (1 - p / 100));
}
