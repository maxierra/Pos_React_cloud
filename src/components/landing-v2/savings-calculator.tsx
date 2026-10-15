"use client";

import { useMemo, useState } from "react";

const PRICE = 50000;

export function SavingsCalculator() {
  const [monthly, setMonthly] = useState("");
  const parsed = Number(monthly.replace(/\D/g, ""));
  const result = useMemo(() => parsed > 0 ? Math.ceil(PRICE / parsed) : null, [parsed]);

  return (
    <div className="lp-calculator">
      <label htmlFor="monthly-cost">¿Cuánto pagás hoy por mes en tu sistema?</label>
      <div className="lp-money-input"><span>$</span><input id="monthly-cost" value={monthly} onChange={(e) => setMonthly(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Ej.: 15000" /></div>
      <p aria-live="polite">{result ? <>Desde el mes <strong>{result + 1}</strong>, Tienda360 ya te cuesta menos.</> : "Escribí tu gasto mensual y te mostramos desde qué mes empezás a ahorrar."}</p>
    </div>
  );
}
