"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  FolderClock,
  Plus,
  Printer,
  RotateCcw,
  Receipt,
  Wallet,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FiscalVoucher } from "@/features/billing/types";
import { voucherTypeLabel } from "@/features/billing/types";
import { emitCreditNoteForVoucher, emitDebitNoteForVoucher, closeConsolidatedPeriod } from "@/app/app/(main)/settings/fiscal-actions";
import type { PendingConsolidationRow } from "@/app/app/(main)/facturacion/actions";
import type { PosBusinessInfo } from "@/lib/ticket-utils";
import { printFiscalVoucherReceipt, printFiscalVoucherTicket } from "@/lib/fiscal-ticket-utils";

type Props = {
  vouchers: FiscalVoucher[];
  fiscalActive: boolean;
  billingMode: "per_sale" | "consolidated" | null;
  pendingConsolidation: PendingConsolidationRow[];
  pendingByPeriod: Record<string, number>;
  business: PosBusinessInfo;
};

type RangeFilter = "today" | "week" | "all";
type GroupMode = "flat" | "day" | "week";

type GroupBlock = {
  key: string;
  label: string;
  vouchers: FiscalVoucher[];
  total: number;
  approvedCount: number;
};

type DailySummary = {
  date: string;
  label: string;
  vouchers: FiscalVoucher[];
  total: number;
  approvedCount: number;
  rejectedCount: number;
};

const STATUS_LABELS: Record<string, string> = {
  approved: "Aprobado",
  rejected: "Rechazado",
  pending: "Pendiente",
  voided_nc: "Anulado (NC)",
};

function money(value: number) {
  return `$${Number(value || 0).toLocaleString("es-AR")}`;
}

function parseDateAsLocal(date: string) {
  return new Date(`${date}T00:00:00`);
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatDateLabel(date: string) {
  return parseDateAsLocal(date).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatWeekLabel(date: string) {
  const start = startOfWeek(parseDateAsLocal(date));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })} - ${end.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  })}`;
}

function statusTone(status: FiscalVoucher["status"]) {
  if (status === "approved") return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  if (status === "rejected") return "bg-rose-100 text-rose-700 ring-rose-200";
  if (status === "voided_nc") return "bg-slate-200 text-slate-700 ring-slate-300";
  return "bg-amber-100 text-amber-700 ring-amber-200";
}

function buildReportHtml(params: {
  business: PosBusinessInfo;
  rows: FiscalVoucher[];
  rangeFilter: RangeFilter;
  grouped: GroupBlock[];
  totals: {
    totalIssued: number;
    approvedAmount: number;
    approvedCount: number;
    rejectedCount: number;
  };
}) {
  const { business, rows, rangeFilter, grouped, totals } = params;
  const titleBusiness = business?.name ?? "Mi negocio";
  const generatedAt = new Date().toLocaleString("es-AR");
  const rangeLabel = rangeFilter === "today" ? "Hoy" : rangeFilter === "week" ? "Ultimos 7 dias" : "Todo el historial";

  const groupMarkup = grouped
    .map((group) => {
      const rowsMarkup = group.vouchers
        .map(
          (voucher) => `
            <tr>
              <td>${voucher.issue_date}</td>
              <td>${voucherTypeLabel(voucher.voucher_type)}</td>
              <td>${String(voucher.pos_number).padStart(4, "0")}-${String(voucher.voucher_number).padStart(8, "0")}</td>
              <td>${voucher.buyer_name ?? "Consumidor Final"}</td>
              <td style="text-align:right;">${money(Number(voucher.total))}</td>
              <td>${STATUS_LABELS[voucher.status] ?? voucher.status}</td>
            </tr>
          `
        )
        .join("");

      return `
        <section class="group">
          <div class="group-head">
            <div>
              <div class="group-title">${group.label}</div>
              <div class="group-sub">${group.approvedCount} aprobados</div>
            </div>
            <div class="group-total">${money(group.total)}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Numero</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>${rowsMarkup}</tbody>
          </table>
        </section>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Reporte de facturacion</title>
    <style>
      @page { size: A4; margin: 18mm 14mm; }
      body { font-family: Arial, sans-serif; color: #14213d; margin: 0; }
      .header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 20px; }
      .brand { font-size: 28px; font-weight: 800; }
      .muted { color: #5f6c80; font-size: 12px; line-height: 1.5; }
      .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
      .card { border: 1px solid #d7e3f1; border-radius: 14px; padding: 12px; background: linear-gradient(180deg, #f9fcff 0%, #eef6fb 100%); }
      .card h4 { margin: 0 0 6px; font-size: 12px; text-transform: uppercase; color: #62809b; letter-spacing: 0.08em; }
      .card strong { font-size: 24px; }
      .group { margin-top: 16px; border: 1px solid #d7e3f1; border-radius: 16px; overflow: hidden; }
      .group-head { display: flex; justify-content: space-between; gap: 16px; align-items: center; padding: 12px 14px; background: linear-gradient(90deg, #e8f7f3 0%, #f8fbff 100%); border-bottom: 1px solid #d7e3f1; }
      .group-title { font-size: 16px; font-weight: 700; }
      .group-sub { font-size: 12px; color: #5f6c80; }
      .group-total { font-size: 22px; font-weight: 800; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 10px 12px; font-size: 12px; border-bottom: 1px solid #edf2f7; text-align: left; }
      th { text-transform: uppercase; color: #6f7f91; background: #fbfdff; font-size: 11px; letter-spacing: 0.04em; }
      tr:last-child td { border-bottom: none; }
      .footer { margin-top: 20px; font-size: 11px; color: #708090; }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="brand">${titleBusiness}</div>
        <div class="muted">
          Reporte de facturacion ARCA<br />
          Rango: ${rangeLabel}<br />
          Generado: ${generatedAt}
        </div>
      </div>
      <div class="muted" style="text-align:right;">
        ${business?.cuit ? `CUIT: ${business.cuit}<br />` : ""}
        ${business?.address ? `${business.address}<br />` : ""}
        ${business?.phone ? `Tel: ${business.phone}` : ""}
      </div>
    </div>

    <div class="summary">
      <div class="card"><h4>Total comprobantes</h4><strong>${rows.length}</strong></div>
      <div class="card"><h4>Total aprobado</h4><strong>${money(totals.approvedAmount)}</strong></div>
      <div class="card"><h4>Aprobados</h4><strong>${totals.approvedCount}</strong></div>
      <div class="card"><h4>Rechazados</h4><strong>${totals.rejectedCount}</strong></div>
    </div>

    ${groupMarkup}

    <div class="footer">
      Reporte generado desde la pantalla de facturacion del POS.
    </div>
    <script>window.onload = () => window.print();</script>
  </body>
</html>`;
}

export function FacturacionClient({
  vouchers,
  fiscalActive,
  billingMode,
  pendingConsolidation,
  pendingByPeriod,
  business,
}: Props) {
  const [pending, startTransition] = React.useTransition();
  const [rangeFilter, setRangeFilter] = React.useState<RangeFilter>("today");
  const [groupMode, setGroupMode] = React.useState<GroupMode>("day");
  const [debitModal, setDebitModal] = React.useState<{
    voucher: FiscalVoucher;
    amount: string;
    description: string;
  } | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const startWeek = React.useMemo(() => {
    const value = new Date();
    value.setDate(value.getDate() - 6);
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);

  const rows = React.useMemo(() => {
    if (rangeFilter === "today") return vouchers.filter((voucher) => voucher.issue_date === today);
    if (rangeFilter === "week") {
      return vouchers.filter((voucher) => parseDateAsLocal(voucher.issue_date) >= startWeek);
    }
    return vouchers;
  }, [rangeFilter, startWeek, today, vouchers]);

  const groupedRows = React.useMemo<GroupBlock[]>(() => {
    if (groupMode === "flat") {
      return [
        {
          key: "all",
          label: "Todos los comprobantes",
          vouchers: rows,
          total: rows.filter((voucher) => voucher.status === "approved").reduce((sum, voucher) => sum + Number(voucher.total), 0),
          approvedCount: rows.filter((voucher) => voucher.status === "approved").length,
        },
      ];
    }

    const map = new Map<string, FiscalVoucher[]>();
    for (const voucher of rows) {
      const key = groupMode === "week" ? formatWeekLabel(voucher.issue_date) : voucher.issue_date;
      map.set(key, [...(map.get(key) ?? []), voucher]);
    }

    return Array.from(map.entries()).map(([key, list]) => ({
      key,
      label: groupMode === "week" ? key : formatDateLabel(key),
      vouchers: list,
      total: list.filter((voucher) => voucher.status === "approved").reduce((sum, voucher) => sum + Number(voucher.total), 0),
      approvedCount: list.filter((voucher) => voucher.status === "approved").length,
    }));
  }, [groupMode, rows]);

  const stats = React.useMemo(() => {
    const approved = rows.filter((voucher) => voucher.status === "approved");
    const rejected = rows.filter((voucher) => voucher.status === "rejected");
    const pendingRows = rows.filter((voucher) => voucher.status === "pending");
    const approvedAmount = approved.reduce((sum, voucher) => sum + Number(voucher.total), 0);
    const avgApproved = approved.length ? approvedAmount / approved.length : 0;

    return {
      totalIssued: rows.length,
      approvedCount: approved.length,
      rejectedCount: rejected.length,
      pendingCount: pendingRows.length,
      approvedAmount,
      avgApproved,
    };
  }, [rows]);

  const dailySummaries = React.useMemo<DailySummary[]>(() => {
    const byDate = new Map<string, FiscalVoucher[]>();
    for (const voucher of rows) {
      byDate.set(voucher.issue_date, [...(byDate.get(voucher.issue_date) ?? []), voucher]);
    }

    return Array.from(byDate.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([date, list]) => ({
        date,
        label: formatDateLabel(date),
        vouchers: list,
        total: list
          .filter((voucher) => voucher.status === "approved")
          .reduce((sum, voucher) => sum + Number(voucher.total), 0),
        approvedCount: list.filter((voucher) => voucher.status === "approved").length,
        rejectedCount: list.filter((voucher) => voucher.status === "rejected").length,
      }));
  }, [rows]);

  const [expandedDates, setExpandedDates] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (dailySummaries.length === 0) {
      setExpandedDates([]);
      return;
    }
    setExpandedDates((current) => {
      const valid = current.filter((date) => dailySummaries.some((item) => item.date === date));
      if (valid.length > 0) return valid;
      return [dailySummaries[0]!.date];
    });
  }, [dailySummaries]);

  const currentMonthChart = React.useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyRows = vouchers.filter((voucher) => voucher.issue_date.startsWith(currentMonth));
    const lastDay = new Date(Number(currentMonth.slice(0, 4)), Number(currentMonth.slice(5, 7)), 0).getDate();
    const totals = new Map<number, number>();

    for (const voucher of monthlyRows) {
      if (voucher.status !== "approved") continue;
      const day = Number(voucher.issue_date.slice(8, 10));
      totals.set(day, (totals.get(day) ?? 0) + Number(voucher.total));
    }

    const points = Array.from({ length: lastDay }, (_, index) => {
      const day = index + 1;
      return {
        day,
        label: String(day).padStart(2, "0"),
        total: totals.get(day) ?? 0,
      };
    });

    const max = Math.max(...points.map((point) => point.total), 0);
    return {
      monthLabel: new Date(`${currentMonth}-01T00:00:00`).toLocaleDateString("es-AR", {
        month: "long",
        year: "numeric",
      }),
      points,
      max,
    };
  }, [vouchers]);

  const emitNc = (id: string) => {
    startTransition(async () => {
      try {
        await emitCreditNoteForVoucher(id);
        toast.success("Nota de credito emitida");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  };

  const openDebitNote = (voucher: FiscalVoucher) => {
    setDebitModal({
      voucher,
      amount: Number(voucher.total || 0).toLocaleString("es-AR", { useGrouping: false }),
      description: `Diferencia sobre ${voucherTypeLabel(voucher.voucher_type)} ${String(voucher.pos_number).padStart(4, "0")}-${String(voucher.voucher_number).padStart(8, "0")}`,
    });
  };

  const submitDebitNote = () => {
    if (!debitModal) return;
    const amount = Number(debitModal.amount.replace(",", "."));
    startTransition(async () => {
      try {
        await emitDebitNoteForVoucher({
          voucherId: debitModal.voucher.id,
          description: debitModal.description,
          amount,
        });
        toast.success("Nota de debito emitida");
        setDebitModal(null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  };

  const reprintFactura = (voucher: FiscalVoucher) => {
    if (!voucher.cae) return;
    printFiscalVoucherTicket(voucher, business);
  };

  const reprintTicket = (voucher: FiscalVoucher) => {
    if (!voucher.cae) return;
    printFiscalVoucherReceipt(voucher, business);
  };

  const exportReportPdf = () => {
    if (rows.length === 0) {
      toast.error("No hay comprobantes para exportar");
      return;
    }
    const html = buildReportHtml({
      business,
      rows,
      rangeFilter,
      grouped: groupedRows,
      totals: {
        totalIssued: stats.totalIssued,
        approvedAmount: stats.approvedAmount,
        approvedCount: stats.approvedCount,
        rejectedCount: stats.rejectedCount,
      },
    });
    const win = window.open("", "_blank", "width=1100,height=900");
    if (!win) {
      toast.error("No se pudo abrir la ventana de impresion");
      return;
    }
    win.document.write(html);
    win.document.close();
  };

  const closePeriod = (period: string) => {
    startTransition(async () => {
      try {
        await closeConsolidatedPeriod(period);
        toast.success("Periodo facturado");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fase 2 pendiente");
      }
    });
  };

  const toggleDate = (date: string) => {
    setExpandedDates((current) =>
      current.includes(date) ? current.filter((item) => item !== date) : [...current, date]
    );
  };

  if (!fiscalActive) {
    return (
      <div className="rounded-3xl border border-dashed border-amber-300 bg-[linear-gradient(180deg,rgba(255,248,229,0.9),rgba(255,251,240,0.75))] p-8 text-center">
        <p className="font-semibold">Facturacion electronica no activa</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Configura certificados y activa la facturacion en Configuracion {"->"} Facturacion ARCA.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {debitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Nota de debito</p>
                <h3 className="mt-1 text-xl font-black text-slate-900">
                  {voucherTypeLabel(debitModal.voucher.voucher_type)}{" "}
                  {String(debitModal.voucher.pos_number).padStart(4, "0")}-{String(debitModal.voucher.voucher_number).padStart(8, "0")}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Carga el concepto y el monto adicional que quieres sumar sobre ese comprobante.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setDebitModal(null)}>
                Cerrar
              </Button>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Descripcion
                <Input
                  value={debitModal.description}
                  onChange={(e) => setDebitModal((current) => (current ? { ...current, description: e.target.value } : current))}
                  placeholder="Ajuste, recargo, diferencia..."
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Monto adicional
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={debitModal.amount}
                  onChange={(e) => setDebitModal((current) => (current ? { ...current, amount: e.target.value } : current))}
                  placeholder="5000"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setDebitModal(null)}>
                Cancelar
              </Button>
              <Button type="button" className="rounded-full" disabled={pending} onClick={submitDebitNote}>
                Emitir ND
              </Button>
            </div>
          </div>
        </div>
      )}

      {billingMode === "consolidated" && (
        <section className="rounded-3xl border border-amber-200/80 bg-[linear-gradient(135deg,rgba(255,247,216,0.9),rgba(255,252,244,0.95))] p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-amber-700">Facturacion consolidada</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Las ventas se acumulan sin CAE hasta cerrar el periodo. Desde aqui puedes ver lo pendiente antes de emitir.
          </p>
          <p className="mt-3 text-sm">
            <strong>{pendingConsolidation.length}</strong> ventas pendientes de facturar
          </p>
          {Object.keys(pendingByPeriod).length > 0 && (
            <ul className="mt-4 space-y-2 text-xs">
              {Object.entries(pendingByPeriod).map(([period, count]) => (
                <li
                  key={period}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200/80 bg-white/75 px-3 py-3"
                >
                  <span>
                    Periodo <strong>{period}</strong> · {count} venta{count === 1 ? "" : "s"}
                  </span>
                  <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => closePeriod(period)}>
                    Cerrar periodo y facturar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="rounded-[28px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(220,252,231,0.55),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Panel fiscal</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Resumen de comprobantes emitidos</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Sigue lo facturado, detecta rechazos rapido y exporta un reporte listo para imprimir o guardar en PDF.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={exportReportPdf}>
              <Download className="size-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { key: "today", label: "Hoy" },
            { key: "week", label: "7 dias" },
            { key: "all", label: "Todo" },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setRangeFilter(option.key as RangeFilter)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-semibold transition",
                rangeFilter === option.key
                  ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 bg-white/80 text-slate-700 hover:border-slate-300"
              )}
            >
              {option.label}
            </button>
          ))}

          <div className="mx-1 hidden h-9 w-px bg-slate-200 sm:block" />

          {[
            { key: "flat", label: "Lista" },
            { key: "day", label: "Por dia" },
            { key: "week", label: "Por semana" },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setGroupMode(option.key as GroupMode)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-semibold transition",
                groupMode === option.key
                  ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                  : "border-emerald-100 bg-emerald-50/70 text-emerald-700 hover:border-emerald-200"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Facturado aprobado"
            value={money(stats.approvedAmount)}
            hint={`${stats.approvedCount} comprobantes`}
            icon={Wallet}
            tone="teal"
          />
          <MetricCard
            title="Promedio por comprobante"
            value={money(stats.avgApproved)}
            hint="Solo aprobados"
            icon={BarChart3}
            tone="blue"
          />
          <MetricCard
            title="Aprobados"
            value={String(stats.approvedCount)}
            hint="Con CAE"
            icon={CheckCircle2}
            tone="green"
          />
          <MetricCard
            title="Rechazados"
            value={String(stats.rejectedCount)}
            hint="Revisar motivo"
            icon={XCircle}
            tone="rose"
          />
          <MetricCard
            title="Pendientes"
            value={String(stats.pendingCount)}
            hint={`${stats.totalIssued} en rango`}
            icon={FolderClock}
            tone="amber"
          />
        </div>

        <div className="mt-6 rounded-[26px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(240,249,255,0.9))] p-4 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Tendencia mensual</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">Facturado aprobado por dia</h3>
              <p className="mt-1 text-sm text-slate-600">
                Vista diaria de {currentMonthChart.monthLabel}. Te ayuda a detectar los dias mas fuertes de facturacion.
              </p>
            </div>
            <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
              Maximo diario: {money(currentMonthChart.max)}
            </div>
          </div>

          <div className="mt-5">
            <MonthlyBillingChart points={currentMonthChart.points} max={currentMonthChart.max} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {rows.length === 0 ? (
          <div className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-12 text-center shadow-sm">
            <CalendarDays className="mx-auto size-10 text-slate-300" />
            <p className="mt-4 text-lg font-semibold text-slate-900">No hay comprobantes en este rango</p>
            <p className="mt-2 text-sm text-slate-500">Prueba con otro periodo o espera nuevas emisiones desde el POS.</p>
          </div>
        ) : groupMode === "day" ? (
          <div className="space-y-3">
            {dailySummaries.map((summary) => {
              const expanded = expandedDates.includes(summary.date);
              return (
                <div
                  key={summary.date}
                  className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5f9fc_100%)] shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => toggleDate(summary.date)}
                    className="flex w-full flex-col gap-3 border-b border-slate-200/80 bg-[linear-gradient(90deg,rgba(219,252,241,0.7),rgba(248,250,252,0.95))] px-5 py-4 text-left md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-white/90 p-1.5 ring-1 ring-slate-200">
                        {expanded ? <ChevronDown className="size-4 text-slate-700" /> : <ChevronRight className="size-4 text-slate-700" />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Resumen del dia</p>
                        <h3 className="mt-1 text-lg font-bold text-slate-900">{summary.label}</h3>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="rounded-full bg-white/80 px-3 py-1 text-slate-600 ring-1 ring-slate-200">
                        {summary.vouchers.length} comprobantes
                      </div>
                      <div className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        {money(summary.total)}
                      </div>
                      {summary.rejectedCount > 0 && (
                        <div className="rounded-full bg-rose-50 px-3 py-1 font-semibold text-rose-700 ring-1 ring-rose-200">
                          {summary.rejectedCount} rechazado{summary.rejectedCount === 1 ? "" : "s"}
                        </div>
                      )}
                    </div>
                  </button>

                  {expanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[980px] text-left text-sm">
                        <thead className="bg-slate-50/90 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Tipo</th>
                            <th className="px-4 py-3">Numero</th>
                            <th className="px-4 py-3">Cliente</th>
                            <th className="px-4 py-3">Total</th>
                            <th className="px-4 py-3">CAE</th>
                            <th className="px-4 py-3">Vto CAE</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3">Ambiente</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          <VoucherRowsTable
                            vouchers={summary.vouchers}
                            pending={pending}
                            onReprintTicket={reprintTicket}
                            onReprintInvoice={reprintFactura}
                            onEmitNc={emitNc}
                            onEmitNd={openDebitNote}
                          />
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          groupedRows.map((group) => (
            <div
              key={group.key}
              className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5f9fc_100%)] shadow-sm"
            >
              <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-[linear-gradient(90deg,rgba(219,252,241,0.7),rgba(248,250,252,0.95))] px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    {groupMode === "week" ? "Semana fiscal" : "Vista general"}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">{group.label}</h3>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="rounded-full bg-white/80 px-3 py-1 text-slate-600 ring-1 ring-slate-200">
                    {group.vouchers.length} comprobantes
                  </div>
                  <div className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    {money(group.total)}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="bg-slate-50/90 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Numero</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">CAE</th>
                      <th className="px-4 py-3">Vto CAE</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Ambiente</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <VoucherRowsTable
                      vouchers={group.vouchers}
                      pending={pending}
                      onReprintTicket={reprintTicket}
                      onReprintInvoice={reprintFactura}
                      onEmitNc={emitNc}
                      onEmitNd={openDebitNote}
                    />
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "teal" | "blue" | "green" | "rose" | "amber";
}) {
  const toneClasses: Record<typeof tone, string> = {
    teal: "from-teal-50 to-cyan-50 border-teal-200/70 text-teal-700",
    blue: "from-sky-50 to-indigo-50 border-sky-200/70 text-sky-700",
    green: "from-emerald-50 to-lime-50 border-emerald-200/70 text-emerald-700",
    rose: "from-rose-50 to-orange-50 border-rose-200/70 text-rose-700",
    amber: "from-amber-50 to-yellow-50 border-amber-200/70 text-amber-700",
  };

  return (
    <div className={cn("rounded-[24px] border bg-gradient-to-br p-4 shadow-sm", toneClasses[tone])}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">{title}</p>
          <div className="mt-3 text-2xl font-black tracking-tight text-slate-900">{value}</div>
          <p className="mt-2 text-xs text-slate-600">{hint}</p>
        </div>
        <div className="rounded-2xl bg-white/80 p-2.5 shadow-sm ring-1 ring-black/5">
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}

function MonthlyBillingChart({
  points,
  max,
}: {
  points: Array<{ day: number; label: string; total: number }>;
  max: number;
}) {
  if (points.length === 0) {
    return <div className="rounded-2xl bg-white/70 p-6 text-sm text-slate-500">Todavia no hay datos del mes actual.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[720px] items-end gap-2 rounded-[22px] bg-white/75 px-3 py-4 ring-1 ring-slate-200/70">
        {points.map((point) => {
          const height = max > 0 ? Math.max(10, (point.total / max) * 180) : 10;
          const active = point.total > 0;
          return (
            <div key={point.day} className="flex min-w-[18px] flex-1 flex-col items-center gap-2">
              <div className="text-[10px] font-semibold text-slate-500">{active ? money(point.total) : ""}</div>
              <div className="flex h-[180px] w-full items-end">
                <div
                  className={cn(
                    "w-full rounded-t-[10px] transition-all",
                    active
                      ? "bg-[linear-gradient(180deg,#0ea5e9_0%,#14b8a6_100%)] shadow-[0_8px_24px_rgba(20,184,166,0.18)]"
                      : "bg-slate-200/70"
                  )}
                  style={{ height: `${height}px` }}
                  title={`Día ${point.label}: ${money(point.total)}`}
                />
              </div>
              <div className="text-[11px] font-semibold text-slate-600">{point.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VoucherRowsTable({
  vouchers,
  pending,
  onReprintTicket,
  onReprintInvoice,
  onEmitNc,
  onEmitNd,
}: {
  vouchers: FiscalVoucher[];
  pending: boolean;
  onReprintTicket: (voucher: FiscalVoucher) => void;
  onReprintInvoice: (voucher: FiscalVoucher) => void;
  onEmitNc: (id: string) => void;
  onEmitNd: (voucher: FiscalVoucher) => void;
}) {
  return (
    <>
      {vouchers.map((voucher, index) => (
        <tr
          key={voucher.id}
          className={cn(
            "border-t border-slate-200/70 transition hover:bg-sky-50/40",
            index % 2 === 0 ? "bg-white/80" : "bg-slate-50/50"
          )}
        >
          <td className="px-4 py-3">
            <div className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {voucherTypeLabel(voucher.voucher_type)}
            </div>
          </td>
          <td className="px-4 py-3 font-mono text-[13px] text-slate-700">
            {String(voucher.pos_number).padStart(4, "0")}-{String(voucher.voucher_number).padStart(8, "0")}
          </td>
          <td className="px-4 py-3 text-slate-700">{voucher.buyer_name ?? "Consumidor Final"}</td>
          <td className="px-4 py-3 text-base font-bold text-slate-900">{money(Number(voucher.total))}</td>
          <td className="px-4 py-3 font-mono text-xs text-slate-600">{voucher.cae ?? "—"}</td>
          <td className="px-4 py-3 text-slate-600">{voucher.cae_expires_at ?? "—"}</td>
          <td className="px-4 py-3">
            <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1", statusTone(voucher.status))}>
              {STATUS_LABELS[voucher.status] ?? voucher.status}
            </span>
          </td>
          <td className="px-4 py-3">
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                voucher.environment === "prod"
                  ? "bg-sky-100 text-sky-700 ring-sky-200"
                  : "bg-violet-100 text-violet-700 ring-violet-200"
              )}
            >
              {voucher.environment === "prod" ? "Prod" : "Test"}
            </span>
          </td>
          <td className="px-4 py-3">
            <div className="flex justify-end gap-2">
              {voucher.status === "approved" && voucher.cae && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full bg-white/80"
                    onClick={() => onReprintTicket(voucher)}
                  >
                    <Receipt className="size-3.5" />
                    Ticket
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full bg-white/80"
                    onClick={() => onReprintInvoice(voucher)}
                  >
                    <Printer className="size-3.5" />
                    Factura
                  </Button>
                  {(voucher.voucher_type === 11 || voucher.voucher_type === 6) && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full bg-white/80"
                      disabled={pending}
                      onClick={() => onEmitNd(voucher)}
                    >
                      <Plus className="size-3.5" />
                      ND
                    </Button>
                  )}
                  {(voucher.voucher_type === 11 || voucher.voucher_type === 6) && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full bg-white/80"
                      disabled={pending}
                      onClick={() => onEmitNc(voucher.id)}
                    >
                      <RotateCcw className="size-3.5" />
                      NC
                    </Button>
                  )}
                </>
              )}
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

function FileTextIcon() {
  return <FileText className="size-4" />;
}

export { FileTextIcon };
