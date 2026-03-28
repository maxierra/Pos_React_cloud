"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function generateDailyReport(businessId: string, date: string) {
  const admin = createAdminClient();
  
  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;

  const { data: business } = await admin
    .from("businesses")
    .select("name")
    .eq("id", businessId)
    .single();

  const { data: sales } = await admin
    .from("sales")
    .select("id, total, payment_method")
    .eq("business_id", businessId)
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay)
    .eq("status", "paid");

  const saleIds = sales?.map(s => s.id) ?? [];
  
  const { data: saleItems } = await admin
    .from("sale_items")
    .select("name, quantity, total")
    .in("sale_id", saleIds.length > 0 ? saleIds : [""]);

  const totalSales = sales?.length ?? 0;
  const totalAmount = sales?.reduce((sum, s) => sum + (s.total ?? 0), 0) ?? 0;

  const salesByPaymentMethod: Record<string, number> = {};
  sales?.forEach(s => {
    const method = s.payment_method ?? "other";
    salesByPaymentMethod[method] = (salesByPaymentMethod[method] ?? 0) + (s.total ?? 0);
  });

  const productTotals: Record<string, { quantity: number; total: number }> = {};
  saleItems?.forEach(item => {
    if (!productTotals[item.name]) {
      productTotals[item.name] = { quantity: 0, total: 0 };
    }
    productTotals[item.name].quantity += item.quantity ?? 0;
    productTotals[item.name].total += item.total ?? 0;
  });

  const topProducts = Object.entries(productTotals)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const { data: cashRegisters } = await admin
    .from("cash_registers")
    .select("id, opened_at, closed_at, opening_amount, closing_amount, expected_totals, closing_totals, difference_totals, notes")
    .eq("business_id", businessId)
    .gte("opened_at", startOfDay)
    .lte("opened_at", endOfDay)
    .not("closed_at", "is", null)
    .order("opened_at", { ascending: true });

  const { data: openRegisters } = await admin
    .from("cash_registers")
    .select("id, opened_at, opening_amount")
    .eq("business_id", businessId)
    .is("closed_at", null)
    .lte("opened_at", endOfDay)
    .order("opened_at", { ascending: false });

  const closures = (cashRegisters ?? []).map(cr => ({
    openedAt: cr.opened_at,
    closedAt: cr.closed_at,
    openingAmount: Number(cr.opening_amount ?? 0),
    closingAmount: Number(cr.closing_amount ?? 0),
    expectedTotals: cr.expected_totals as Record<string, number> | null,
    closingTotals: cr.closing_totals as Record<string, number> | null,
    differenceTotals: cr.difference_totals as Record<string, number> | null,
    notes: cr.notes,
  }));

  const totalCashInDrawer = closures.reduce((sum, c) => sum + c.closingAmount, 0);
  const totalExpectedCash = closures.reduce((sum, c) => sum + (c.expectedTotals?.cash ?? 0), 0);
  const totalDifference = closures.reduce((sum, c) => sum + (c.differenceTotals?.cash ?? 0), 0);
  const hasOpenRegister = (openRegisters?.length ?? 0) > 0;
  const reportStatus = hasOpenRegister ? "partial" : "final";
  const reportStatusLabel = hasOpenRegister ? "Parcial (caja abierta)" : "Final (caja cerrada)";

  return {
    businessName: business?.name ?? "Negocio",
    businessEmail: "",
    date,
    totalSales,
    totalAmount,
    salesByPaymentMethod,
    topProducts,
    closures,
    totalCashInDrawer,
    totalExpectedCash,
    totalDifference,
    hasOpenRegister,
    reportStatus,
    reportStatusLabel,
  };
}

export async function sendDailyReportEmail(email: string, report: Awaited<ReturnType<typeof generateDailyReport>>) {
  const { Resend } = await import("resend");
  
  const resend = new Resend(process.env.RESEND_API_KEY);

  const paymentMethodsData = Object.entries(report.salesByPaymentMethod).sort((a, b) => b[1] - a[1]);
  const paymentMethods = paymentMethodsData
    .map(([method, amount]) => `  - ${method}: $${amount.toLocaleString("es-AR")}`)
    .join("\n");

  const topProductsText = report.topProducts
    .map((p, i) => `  ${i + 1}. ${p.name}: ${p.quantity} unidades - $${p.total.toLocaleString("es-AR")}`)
    .join("\n");

  const maxProduct = report.topProducts.length > 0 ? Math.max(...report.topProducts.map((p) => p.total)) : 1;
  const maxPaymentMethod = paymentMethodsData.length > 0 ? Math.max(...paymentMethodsData.map(([, amount]) => amount)) : 1;
  
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatMoney = (amount: number) => amount.toLocaleString("es-AR");
  const formatMethod = (method: string) =>
    method === "cash"
      ? "Efectivo"
      : method === "card"
        ? "Tarjeta"
        : method === "transfer"
          ? "Transferencia"
          : method === "mp"
            ? "Mercado Pago"
            : method;

  const averageTicket = report.totalSales > 0 ? report.totalAmount / report.totalSales : 0;
  const closureCount = report.closures?.length ?? 0;
  const totalDifferenceAbsBase = Math.max(report.totalExpectedCash, 1);
  const differencePercent = (Math.abs(report.totalDifference) / totalDifferenceAbsBase) * 100;
  const differenceLabel = report.totalDifference >= 0 ? "Sobrante" : "Faltante";
  const statusBg = report.reportStatus === "final" ? "#dcfce7" : "#fff7ed";
  const statusBorder = report.reportStatus === "final" ? "#86efac" : "#fdba74";
  const statusColor = report.reportStatus === "final" ? "#166534" : "#9a3412";
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte Diario</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#eef2f7;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#0f766e 0%,#115e59 100%);padding:28px 28px 22px 28px;">
              <div style="font-size:26px;line-height:1.2;font-weight:800;color:#ffffff;">Reporte Diario</div>
              <div style="margin-top:6px;font-size:14px;color:#ccfbf1;">${report.businessName}</div>
              <div style="margin-top:14px;display:inline-block;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,0.15);color:#ffffff;font-size:12px;">
                Fecha: ${report.date}
              </div>
              <div style="margin-top:10px;display:inline-block;padding:6px 10px;border-radius:999px;background:${statusBg};border:1px solid ${statusBorder};color:${statusColor};font-size:12px;font-weight:700;">
                Estado: ${report.reportStatusLabel}
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 24px 6px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="padding:0 6px 10px 0;">
                    <div style="background:#ecfeff;border:1px solid #99f6e4;border-radius:12px;padding:14px;">
                      <div style="font-size:11px;color:#0f766e;text-transform:uppercase;font-weight:700;letter-spacing:.6px;">Ventas</div>
                      <div style="margin-top:6px;font-size:28px;font-weight:800;color:#134e4a;">${report.totalSales}</div>
                    </div>
                  </td>
                  <td width="50%" style="padding:0 0 10px 6px;">
                    <div style="background:#0f766e;border:1px solid #0f766e;border-radius:12px;padding:14px;">
                      <div style="font-size:11px;color:#ccfbf1;text-transform:uppercase;font-weight:700;letter-spacing:.6px;">Total vendido</div>
                      <div style="margin-top:6px;font-size:28px;font-weight:800;color:#ffffff;">$${formatMoney(report.totalAmount)}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:0 6px 0 0;">
                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;">
                      <div style="font-size:11px;color:#475569;text-transform:uppercase;font-weight:700;letter-spacing:.6px;">Ticket promedio</div>
                      <div style="margin-top:6px;font-size:22px;font-weight:800;color:#0f172a;">$${formatMoney(averageTicket)}</div>
                    </div>
                  </td>
                  <td width="50%" style="padding:0 0 0 6px;">
                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;">
                      <div style="font-size:11px;color:#475569;text-transform:uppercase;font-weight:700;letter-spacing:.6px;">Turnos cerrados</div>
                      <div style="margin-top:6px;font-size:22px;font-weight:800;color:#0f172a;">${closureCount}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 24px 0 24px;">
              <div style="font-size:18px;font-weight:800;color:#0f172a;">Metodos de pago</div>
              <div style="margin-top:10px;border:1px solid #e2e8f0;border-radius:12px;padding:14px;background:#ffffff;">
                ${
                  paymentMethodsData.length > 0
                    ? paymentMethodsData
                        .map(([method, amount]) => `
                <div style="margin-bottom:12px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="font-size:14px;color:#1f2937;font-weight:600;">${formatMethod(method)}</td>
                      <td align="right" style="font-size:14px;color:#111827;font-weight:800;">$${formatMoney(amount)}</td>
                    </tr>
                  </table>
                  <div style="margin-top:6px;height:8px;border-radius:999px;background:#e5e7eb;overflow:hidden;">
                    <div style="height:8px;width:${Math.max((amount / maxPaymentMethod) * 100, 6)}%;background:#14b8a6;"></div>
                  </div>
                </div>
                `)
                        .join("")
                    : `<div style="font-size:14px;color:#64748b;">No hubo ventas en este periodo.</div>`
                }
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 24px 0 24px;">
              <div style="font-size:18px;font-weight:800;color:#0f172a;">Caja y cierres</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:10px;">
                <tr>
                  <td width="33.33%" style="padding:0 6px 0 0;">
                    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:12px;">
                      <div style="font-size:11px;color:#854d0e;text-transform:uppercase;font-weight:700;">Efectivo en caja</div>
                      <div style="margin-top:6px;font-size:18px;font-weight:800;color:#713f12;">$${formatMoney(report.totalCashInDrawer)}</div>
                    </div>
                  </td>
                  <td width="33.33%" style="padding:0 3px;">
                    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:12px;">
                      <div style="font-size:11px;color:#1d4ed8;text-transform:uppercase;font-weight:700;">Esperado</div>
                      <div style="margin-top:6px;font-size:18px;font-weight:800;color:#1e3a8a;">$${formatMoney(report.totalExpectedCash)}</div>
                    </div>
                  </td>
                  <td width="33.33%" style="padding:0 0 0 6px;">
                    <div style="background:${report.totalDifference >= 0 ? "#ecfdf5" : "#fef2f2"};border:1px solid ${report.totalDifference >= 0 ? "#86efac" : "#fecaca"};border-radius:12px;padding:12px;">
                      <div style="font-size:11px;color:${report.totalDifference >= 0 ? "#15803d" : "#b91c1c"};text-transform:uppercase;font-weight:700;">${differenceLabel}</div>
                      <div style="margin-top:6px;font-size:18px;font-weight:800;color:${report.totalDifference >= 0 ? "#166534" : "#991b1b"};">
                        ${report.totalDifference >= 0 ? "+" : ""}$${formatMoney(report.totalDifference)}
                      </div>
                      <div style="margin-top:4px;font-size:11px;color:#64748b;">${differencePercent.toFixed(1)}% del esperado</div>
                    </div>
                  </td>
                </tr>
              </table>

              ${
                report.closures && report.closures.length > 0
                  ? report.closures
                      .map(
                        (cr, idx) => `
              <div style="margin-top:10px;border:1px solid #e2e8f0;border-radius:12px;padding:12px;background:#f8fafc;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="font-size:14px;color:#0f172a;font-weight:700;">Turno ${idx + 1}</td>
                    <td align="right" style="font-size:12px;color:#64748b;">${formatTime(cr.openedAt)} - ${cr.closedAt ? formatTime(cr.closedAt) : "Abierta"}</td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;">
                  <tr>
                    <td style="font-size:13px;color:#334155;">Apertura: <strong>$${formatMoney(cr.openingAmount)}</strong></td>
                    <td style="font-size:13px;color:#334155;">Cierre: <strong>$${formatMoney(cr.closingAmount)}</strong></td>
                    <td style="font-size:13px;color:#334155;">Esperado: <strong>$${formatMoney(cr.expectedTotals?.cash ?? 0)}</strong></td>
                  </tr>
                </table>
                ${
                  cr.differenceTotals?.cash !== undefined
                    ? `<div style="margin-top:8px;font-size:13px;color:${cr.differenceTotals.cash >= 0 ? "#15803d" : "#b91c1c"};font-weight:700;">
                  Diferencia: ${cr.differenceTotals.cash >= 0 ? "+" : ""}$${formatMoney(cr.differenceTotals.cash)}
                </div>`
                    : ""
                }
                ${cr.notes ? `<div style="margin-top:8px;font-size:12px;color:#64748b;">Nota: ${cr.notes}</div>` : ""}
              </div>
              `
                      )
                      .join("")
                  : `<div style="margin-top:10px;font-size:14px;color:#64748b;border:1px solid #e2e8f0;border-radius:12px;padding:12px;">No hubo cierres de caja en esta fecha.</div>`
              }
            </td>
          </tr>

          <tr>
            <td style="padding:18px 24px 20px 24px;">
              <div style="font-size:18px;font-weight:800;color:#0f172a;">Top productos</div>
              <div style="margin-top:10px;border:1px solid #e2e8f0;border-radius:12px;padding:14px;background:#ffffff;">
                ${
                  report.topProducts.length > 0
                    ? report.topProducts
                        .map(
                          (p, i) => `
                <div style="margin-bottom:12px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="font-size:14px;color:#111827;font-weight:700;">#${i + 1} ${p.name}</td>
                      <td align="right" style="font-size:14px;color:#0f766e;font-weight:800;">$${formatMoney(p.total)}</td>
                    </tr>
                  </table>
                  <div style="margin-top:4px;font-size:12px;color:#64748b;">${p.quantity} unidades</div>
                  <div style="margin-top:6px;height:8px;border-radius:999px;background:#e5e7eb;overflow:hidden;">
                    <div style="height:8px;width:${Math.max((p.total / maxProduct) * 100, 6)}%;background:#0d9488;"></div>
                  </div>
                </div>
                `
                        )
                        .join("")
                    : `<div style="font-size:14px;color:#64748b;">Sin datos de productos en este periodo.</div>`
                }
              </div>
            </td>
          </tr>
        </table>

        <div style="padding:14px 6px 0 6px;text-align:center;font-size:11px;color:#94a3b8;">
          Enviado automaticamente por <span style="color:#0f766e;font-weight:700;">POS SaaS</span>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const closuresText = report.closures && report.closures.length > 0 
    ? report.closures.map((cr, i) => 
        `Turno ${i + 1}: Apertura $${formatMoney(cr.openingAmount)} | Cierre $${formatMoney(cr.closingAmount)} | Esperado $${formatMoney(cr.expectedTotals?.cash ?? 0)} | Diferencia: ${cr.differenceTotals?.cash !== undefined ? (cr.differenceTotals.cash >= 0 ? "+" : "") + "$" + formatMoney(cr.differenceTotals.cash) : "N/A"}`
      ).join("\n")
    : "No hubo cierres de caja";

  const text = `
📊 Resumen de ventas - ${report.businessName}

📅 Fecha: ${report.date}
📌 Estado: ${report.reportStatusLabel}

💰 RESUMEN
━━━━━━━━━━━━
Ventas realizadas: ${report.totalSales}
Total vendido: $${report.totalAmount.toLocaleString("es-AR")}
Ticket promedio: $${formatMoney(averageTicket)}
Turnos cerrados: ${closureCount}

💳 POR MÉTODO DE PAGO
━━━━━━━━━━━━
${paymentMethods || "Sin ventas"}

💰 CIERRES DE CAJA
━━━━━━━━━━━━
Efectivo en caja: $${report.totalCashInDrawer}
Esperado: $${report.totalExpectedCash}
Diferencia: ${report.totalDifference >= 0 ? "+" : ""}$${report.totalDifference}
${closuresText}

🏆 TOP 5 PRODUCTOS
━━━━━━━━━━━━
${topProductsText || "Sin datos"}

---
Enviado automáticamente por POS SaaS
`;

  console.log("[resend] Sending to:", email);
  console.log("[resend] From:", "reportes@tienda360.tech");
  
  const result = await resend.emails.send({
    from: "reportes@tienda360.tech",
    to: [email],
    subject: `📊 Reporte del día (${report.reportStatus === "final" ? "cierre final" : "parcial"}) - ${report.businessName} - ${report.date}`,
    text,
    html,
  });

  console.log("[resend] Result:", JSON.stringify(result, null, 2));
  
  if (result.error) {
    console.log("[resend] Error:", result.error);
  } else {
    console.log("[resend] Email ID:", result.data?.id);
  }

  return result;
}

export async function processDailyReports() {
  const admin = createAdminClient();
  
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", { 
    timeZone: "America/Argentina/Buenos_Aires", 
    hour: "2-digit", 
    minute: "2-digit", 
    hour12: false 
  });
  const [currentHour, currentMinute] = formatter.format(now).split(":").map(Number);
  const currentTimeStr = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;
  
  console.log("[cron] Current time (Argentina):", currentTimeStr);

  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(dateParts.find((p) => p.type === "year")?.value);
  const month = Number(dateParts.find((p) => p.type === "month")?.value);
  const day = Number(dateParts.find((p) => p.type === "day")?.value);
  const argentinaTodayUtc = new Date(Date.UTC(year, month - 1, day));
  const dateStr = argentinaTodayUtc.toISOString().split("T")[0];

  console.log("[cron] Looking for businesses with daily reports enabled...");

  const { data: businesses, error: bizError } = await admin
    .from("businesses")
    .select("id, name, report_daily_enabled, report_daily_email, report_daily_time")
    .eq("report_daily_enabled", true)
    .not("report_daily_email", "is", null);

  console.log("[cron] Raw businesses data:", JSON.stringify(businesses, null, 2));

  if (bizError) {
    console.log("[cron] Error fetching businesses:", bizError);
  }

  const results = [];
  const debugInfo: any[] = [];

  for (const business of businesses ?? []) {
    let businessTime = "08:00";
    if (business.report_daily_time) {
      if (typeof business.report_daily_time === "string") {
        const parts = business.report_daily_time.split(":");
        const hours = parseInt(parts[0]);
        const minutes = parts[1];
        businessTime = `${hours.toString().padStart(2, "0")}:${minutes}`;
      } else if (business.report_daily_time instanceof Date) {
        businessTime = business.report_daily_time.toTimeString().substring(0, 5);
      }
    }
    
    const [bizHour, bizMin] = businessTime.split(":").map(Number);
    const [currHour, currMin] = currentTimeStr.split(":").map(Number);
    const bizTotal = bizHour * 60 + bizMin;
    const currTotal = currHour * 60 + currMin;
    const minutesAfterSchedule = currTotal - bizTotal;
    // Only send after scheduled time, during the current 5-minute cron window.
    // This avoids duplicate sends before/after because of absolute time difference.
    const shouldSend = minutesAfterSchedule >= 0 && minutesAfterSchedule < 5;
    
    debugInfo.push({
      name: business.name,
      configured: business.report_daily_time,
      parsed: businessTime,
      current: currentTimeStr,
      shouldSend,
      minutesAfterSchedule
    });
    
    if (!shouldSend) {
      console.log(
        `[cron] Skipping ${business.name} - outside send window (${businessTime} -> ${currentTimeStr}, delta=${minutesAfterSchedule}min)`
      );
      continue;
    }

    console.log("[cron] Processing:", business.name, "email:", business.report_daily_email);
    try {
      const report = await generateDailyReport(business.id, dateStr);
      const result = await sendDailyReportEmail(business.report_daily_email!, report);
      results.push({
        business: business.name,
        success: true,
        emailId: result.data?.id,
      });
    } catch (error) {
      console.log("[cron] Error for", business.name, ":", error);
      results.push({
        business: business.name,
        success: false,
        error: String(error),
      });
    }
  }

  return { results, debugInfo };
}
