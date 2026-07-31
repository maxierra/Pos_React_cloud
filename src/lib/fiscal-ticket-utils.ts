"use client";

import * as React from "react";
import QRCode from "react-qr-code";
import { renderToStaticMarkup } from "react-dom/server";

import type { FiscalVoucher } from "@/features/billing/types";
import { voucherTypeLabel } from "@/features/billing/types";
import { printTicket, type PosBusinessInfo, type TicketData } from "@/lib/ticket-utils";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildQrMarkup(payload: string | null) {
  if (!payload) return "";
  return renderToStaticMarkup(
    React.createElement(QRCode, {
      value: payload,
      size: 116,
      bgColor: "#FFFFFF",
      fgColor: "#111111",
      level: "M",
    })
  );
}

function money(value: number) {
  return `$${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function voucherPresentation(voucherType: number) {
  switch (voucherType) {
    case 6:
      return {
        letter: "B",
        code: "006",
        title: "FACTURA",
        businessTaxCondition: "Responsable Inscripto",
        buyerTaxValue: "Consumidor Final",
      };
    case 8:
      return {
        letter: "B",
        code: "008",
        title: "NOTA DE CREDITO",
        businessTaxCondition: "Responsable Inscripto",
        buyerTaxValue: "Consumidor Final",
      };
    case 12:
      return {
        letter: "C",
        code: "012",
        title: "NOTA DE DEBITO",
        businessTaxCondition: "Responsable Monotributo",
        buyerTaxValue: "Consumidor Final",
      };
    case 13:
      return {
        letter: "C",
        code: "013",
        title: "NOTA DE CREDITO",
        businessTaxCondition: "Responsable Monotributo",
        buyerTaxValue: "Consumidor Final",
      };
    case 7:
      return {
        letter: "B",
        code: "007",
        title: "NOTA DE DEBITO",
        businessTaxCondition: "Responsable Inscripto",
        buyerTaxValue: "Consumidor Final",
      };
    case 11:
    default:
      return {
        letter: "C",
        code: "011",
        title: "FACTURA",
        businessTaxCondition: "Responsable Monotributo",
        buyerTaxValue: "Consumidor Final",
      };
  }
}

export function printFiscalVoucherTicket(voucher: FiscalVoucher, business?: PosBusinessInfo) {
  const qrMarkup = buildQrMarkup(voucher.qr_payload);
  const rows = (voucher.fiscal_voucher_items ?? [])
    .map((item) => {
      const unitPrice = Number(item.unit_price ?? 0);
      const subtotal = Number(item.subtotal ?? 0);
      const cleanedName = item.name.replace(/\s+-\s+/g, " ").trim();
      return `
        <tr>
          <td class="col-code">-</td>
          <td class="col-desc">
            <div class="item-name">${escapeHtml(cleanedName)}</div>
          </td>
          <td class="col-qty">${Number(item.quantity).toLocaleString("es-AR")}</td>
          <td class="col-unit">$${unitPrice.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td class="col-total">$${subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `;
    })
    .join("");

  const businessName = business?.name?.trim() || "Mi negocio";
  const businessAddress = business?.address?.trim() || "Domicilio no informado";
  const businessPhone = business?.phone?.trim() || "-";
  const businessCuit = business?.cuit?.trim() || "-";
  const businessIibb = business?.iibb?.trim() || "No informado";
  const businessActivityStart = business?.activity_start_date
    ? new Date(`${business.activity_start_date}T00:00:00`).toLocaleDateString("es-AR")
    : "No informado";
  const headerText = business?.ticket_header?.trim();
  const footerText = business?.ticket_footer?.trim();
  const voucherLabel = voucherTypeLabel(voucher.voucher_type);
  const presentation = voucherPresentation(voucher.voucher_type);
  const documentNumber = `${String(voucher.pos_number).padStart(4, "0")}-${String(voucher.voucher_number).padStart(8, "0")}`;
  const total = Number(voucher.total ?? 0);
  const buyerName = voucher.buyer_name?.trim() || "Consumidor Final";
  const buyerDocument = voucher.buyer_doc_number && voucher.buyer_doc_number !== "0" ? voucher.buyer_doc_number : "No informado";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Comprobante fiscal</title>
<style>
  @page { size: A4; margin: 14mm; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; }
  .sheet { width: 100%; max-width: 980px; margin: 0 auto; border: 1px solid #111827; }
  .original-bar { border-bottom: 1px solid #111827; text-align: center; font-size: 12px; font-weight: 700; padding: 4px 0; }
  .top { display: grid; grid-template-columns: 1.5fr 84px 1.35fr; border-bottom: 1px solid #111827; }
  .issuer, .receiver { padding: 12px 14px; min-height: 122px; }
  .middle { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border-left: 1px solid #111827; border-right: 1px solid #111827; background: #fff; }
  .letter-box { width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; border: 2px solid #111827; font-size: 30px; font-weight: 900; line-height: 1; }
  .letter-caption { font-size: 10px; font-weight: 700; color: #111827; }
  .doc-title { font-size: 20px; font-weight: 800; }
  .issuer-name { font-size: 18px; font-weight: 800; line-height: 1.1; }
  .small { font-size: 11px; line-height: 1.3; color: #111827; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; margin-top: 8px; }
  .meta-label { font-size: 10px; font-weight: 700; color: #111827; text-transform: uppercase; }
  .meta-value { font-size: 12px; font-weight: 700; margin-top: 2px; line-height: 1.2; }
  .issuer .small strong, .receiver .small strong { color: #111827; }
  .receiver-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; margin-top: 10px; }
  .receiver-grid .meta-value { font-size: 12px; }
  .section { padding: 10px 14px; border-bottom: 1px solid #111827; }
  .notes { font-size: 10px; line-height: 1.35; color: #374151; }
  .client-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; }
  table { width: 100%; border-collapse: collapse; }
  .detail thead th { background: #f3f4f6; color: #111827; font-size: 10px; font-weight: 700; border: 1px solid #111827; padding: 5px 7px; text-align: left; }
  .detail tbody td { border-left: 1px solid #d1d5db; border-right: 1px solid #d1d5db; padding: 6px 7px; font-size: 12px; vertical-align: top; }
  .detail tbody tr:last-child td { border-bottom: 1px solid #111827; }
  .item-name { font-weight: 400; line-height: 1.3; color: #111827; }
  .col-code { width: 74px; color: #111827; }
  .col-desc { width: auto; }
  .col-qty, .col-unit, .col-total { white-space: nowrap; text-align: right; width: 110px; }
  .summary-wrap { display: grid; grid-template-columns: 1fr 320px; gap: 12px; padding: 10px 14px; border-bottom: 1px solid #111827; align-items: end; min-height: 220px; }
  .summary-spacer { min-height: 180px; border: 1px solid #111827; border-right: 0; }
  .summary-box { border: 1px solid #111827; align-self: end; }
  .summary-box table td { padding: 5px 8px; font-size: 12px; border-bottom: 1px solid #d1d5db; }
  .summary-box table tr:last-child td { border-bottom: 0; }
  .summary-box .amount { text-align: right; font-weight: 700; }
  .summary-box .currency { width: 24px; text-align: center; font-weight: 700; }
  .summary-box .total-row td { font-weight: 800; }
  .fiscal-box { display: grid; grid-template-columns: 132px 1fr 230px; gap: 12px; align-items: end; border-top: 1px solid #111827; margin: 0 14px; padding: 10px 0; }
  .fiscal-grid { display: grid; grid-template-columns: 96px 1fr; gap: 4px 8px; font-size: 12px; align-items: center; max-width: 320px; }
  .fiscal-grid .label { font-weight: 700; color: #111827; text-transform: none; font-size: 11px; }
  .fiscal-grid .value { font-weight: 700; }
  .qr-wrap { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
  .qr { display: flex; justify-content: center; }
  .arca-brand { font-size: 20px; font-weight: 900; letter-spacing: 0.02em; color: #9ca3af; line-height: 1; }
  .legal { font-size: 10px; text-align: left; color: #374151; line-height: 1.25; }
  .fiscal-note { font-size: 10px; line-height: 1.25; color: #374151; }
  .footer { padding: 8px 14px 14px; font-size: 10px; color: #374151; border-top: 1px solid #111827; }
  .footer-strong { font-weight: 700; color: #111827; }
</style></head>
<body>
  <div class="sheet">
    <div class="original-bar">ORIGINAL</div>
    <div class="top">
      <div class="issuer">
        <div class="issuer-name">${escapeHtml(businessName)}</div>
        <div class="small" style="margin-top:8px;">
          ${headerText ? `${escapeHtml(headerText)}<br />` : ""}
          ${escapeHtml(businessAddress)}<br />
          Tel: ${escapeHtml(businessPhone)}<br />
          ${escapeHtml(presentation.businessTaxCondition)}<br />
          CUIT: ${escapeHtml(businessCuit)}
        </div>
      </div>
      <div class="middle">
        <div class="letter-box">${presentation.letter}</div>
        <div class="letter-caption">COD. ${presentation.code}</div>
      </div>
      <div class="receiver">
        <div class="doc-title">${presentation.title}</div>
        <div class="small" style="margin-top:4px; font-weight:700;">${escapeHtml(documentNumber)}</div>
        <div class="receiver-grid">
          <div>
            <div class="meta-label">Fecha de Emision</div>
            <div class="meta-value">${escapeHtml(voucher.issue_date)}</div>
          </div>
          <div>
            <div class="meta-label">CUIT</div>
            <div class="meta-value">${escapeHtml(businessCuit)}</div>
          </div>
          <div>
            <div class="meta-label">Ingresos Brutos</div>
            <div class="meta-value">${escapeHtml(businessIibb)}</div>
          </div>
          <div>
            <div class="meta-label">Inicio de Actividades</div>
            <div class="meta-value">${escapeHtml(businessActivityStart)}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="client-grid">
        <div>
          <div class="meta-label">Nombre</div>
          <div class="meta-value">${escapeHtml(buyerName)}</div>
        </div>
        <div>
          <div class="meta-label">DNI</div>
          <div class="meta-value">${escapeHtml(buyerDocument)}</div>
        </div>
        <div>
          <div class="meta-label">Domicilio</div>
          <div class="meta-value">No informado</div>
        </div>
        <div>
          <div class="meta-label">Cond. IVA</div>
          <div class="meta-value">${escapeHtml(presentation.buyerTaxValue)}</div>
        </div>
      </div>
    </div>

    <div class="section" style="padding-top:0;">
      <table class="detail">
        <thead>
          <tr>
            <th>Codigo</th>
            <th>Descripcion</th>
            <th>Cant.</th>
            <th>Precio unit.</th>
            <th>Importe</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="5" style="text-align:center;color:#64748b;">Sin detalle de items</td></tr>`}
        </tbody>
      </table>
    </div>

    <div class="summary-wrap">
      <div class="summary-spacer"></div>
      <div class="summary-box">
        <table>
          <tr>
            <td>Subtotal:</td>
            <td class="currency">$</td>
            <td class="amount">${Number(total).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td>Dto./Recargo:</td>
            <td class="currency">$</td>
            <td class="amount">${Number(0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
          <tr class="total-row">
            <td>Total:</td>
            <td class="currency">$</td>
            <td class="amount">${Number(total).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="fiscal-box">
      ${
        qrMarkup
          ? `<div class="qr-wrap">
               <div class="qr">${qrMarkup}</div>
               <div class="arca-brand">ARCA</div>
               <div class="legal"><strong>Comprobante Autorizado</strong></div>
             </div>`
          : ""
      }
      <div class="fiscal-note">
        Esta Administracion Federal no se responsabiliza por los datos ingresados en el detalle de la operacion.
      </div>
      <div class="fiscal-grid">
        <div class="label">CAE N°</div>
        <div class="value">${escapeHtml(voucher.cae ?? "-")}</div>
        <div class="label">Fecha de Vto. de CAE</div>
        <div class="value">${escapeHtml(voucher.cae_expires_at ?? "-")}</div>
      </div>
    </div>

    <div class="footer">
      ${footerText ? `<div class="footer-strong">${escapeHtml(footerText)}</div>` : ""}
      <div style="margin-top:8px;">Gracias por su compra.</div>
    </div>
  </div>
  <script>window.onload=function(){window.print();}</script>
</body></html>`;

  const w = window.open("", "_blank", "width=1100,height=900");
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

export function printFiscalVoucherReceipt(voucher: FiscalVoucher, business?: PosBusinessInfo) {
  if (!voucher.cae) return false;

  const ticketData: TicketData = {
    kind: "sale",
    business: business ?? null,
    saleId: voucher.sale_id ?? voucher.id,
    created_at: voucher.created_at,
    customerName: voucher.buyer_name ?? "Consumidor Final",
    items: (voucher.fiscal_voucher_items ?? []).map((item) => ({
      name: item.name,
      quantity: Number(item.quantity ?? 0),
      unit_price: Number(item.unit_price ?? 0),
    })),
    total: Number(voucher.total ?? 0),
    fiscal: {
      voucherTypeLabel: voucherTypeLabel(voucher.voucher_type),
      posNumber: voucher.pos_number,
      voucherNumber: voucher.voucher_number,
      cae: voucher.cae,
      caeExpiresAt: voucher.cae_expires_at ?? "",
      qrPayload: voucher.qr_payload ?? "",
    },
  };

  return printTicket(ticketData);
}

export type FiscalTicketData = {
  voucherTypeLabel: string;
  posNumber: number;
  voucherNumber: number;
  cae: string;
  caeExpiresAt: string;
  qrPayload: string;
};

export function appendFiscalLinesToTicket(lines: string[], fiscal: FiscalTicketData): string[] {
  lines.push("----------------");
  lines.push(fiscal.voucherTypeLabel);
  lines.push(`PtoVta: ${fiscal.posNumber}  Comp: ${fiscal.voucherNumber}`);
  lines.push(`CAE: ${fiscal.cae}`);
  lines.push(`Vto CAE: ${fiscal.caeExpiresAt}`);
  if (fiscal.qrPayload) lines.push(`Verificar: ${fiscal.qrPayload}`);
  return lines;
}
