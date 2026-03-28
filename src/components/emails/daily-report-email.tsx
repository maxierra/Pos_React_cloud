import * as React from "react";

export interface DailyReportEmailProps {
  businessName: string;
  date: string;
  totalSales: number;
  totalTickets: number;
  cashTotal: number;
  cardTotal: number;
  transferTotal: number;
  mpTotal: number;
  topProducts: { name: string; qty: number; total: number }[];
}

export function DailyReportEmail({
  businessName,
  date,
  totalSales,
  totalTickets,
  cashTotal,
  cardTotal,
  transferTotal,
  mpTotal,
  topProducts,
}: DailyReportEmailProps) {
  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);

  return (
    <div style={{ fontFamily: "sans-serif", color: "#333", maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ fontSize: "24px", color: "#111" }}>Resumen Diario - {businessName}</h1>
      <p style={{ fontSize: "16px", color: "#666" }}>Fecha: {date}</p>
      
      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <div style={{ padding: "15px", backgroundColor: "#f9fafb", borderRadius: "8px", flex: 1 }}>
          <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>Ventas Totales</p>
          <p style={{ margin: "5px 0 0", fontSize: "24px", fontWeight: "bold", color: "#10b981" }}>
            {formatMoney(totalSales)}
          </p>
        </div>
        <div style={{ padding: "15px", backgroundColor: "#f9fafb", borderRadius: "8px", flex: 1 }}>
          <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>Tickets</p>
          <p style={{ margin: "5px 0 0", fontSize: "24px", fontWeight: "bold" }}>{totalTickets}</p>
        </div>
      </div>

      <h2 style={{ fontSize: "18px", marginTop: "30px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
        Desglose por de Pago
      </h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li style={{ padding: "8px 0", display: "flex", justifyContent: "space-between" }}>
          <span>Efectivo</span> <strong>{formatMoney(cashTotal)}</strong>
        </li>
        <li style={{ padding: "8px 0", display: "flex", justifyContent: "space-between", borderTop: "1px solid #eee" }}>
          <span>Tarjetas</span> <strong>{formatMoney(cardTotal)}</strong>
        </li>
        <li style={{ padding: "8px 0", display: "flex", justifyContent: "space-between", borderTop: "1px solid #eee" }}>
          <span>Transferencia</span> <strong>{formatMoney(transferTotal)}</strong>
        </li>
        <li style={{ padding: "8px 0", display: "flex", justifyContent: "space-between", borderTop: "1px solid #eee" }}>
          <span>Mercado Pago</span> <strong>{formatMoney(mpTotal)}</strong>
        </li>
      </ul>

      {topProducts.length > 0 && (
        <>
          <h2 style={{ fontSize: "18px", marginTop: "30px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
            Productos más vendidos
          </h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {topProducts.map((p, i) => (
              <li key={i} style={{ padding: "8px 0", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "bold" }}>{p.name} <span style={{ fontWeight: "normal", color: "#666", fontSize: "12px" }}>(x{p.qty})</span></span>
                <span>{formatMoney(p.total)}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div style={{ marginTop: "40px", fontSize: "12px", color: "#999", textAlign: "center" }}>
        <p>Este es un reporte automático generado por tu Sistema POS.</p>
      </div>
    </div>
  );
}
