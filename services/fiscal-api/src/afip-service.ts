import Afip from "@afipsdk/afip.js";
import { supabaseAdmin } from "./supabase.js";
import { loadCertAndKey } from "./cert-service.js";
import { config, type FiscalEnvironment } from "./config.js";

export type VoucherItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

const VOUCHER_TYPE_FACTURA_B = 6;
const VOUCHER_TYPE_NC_B = 8;
const VOUCHER_TYPE_FACTURA_C = 11;
const VOUCHER_TYPE_NC_C = 13;

type SupportedFacturaType = 6 | 11;
type SupportedCreditNoteType = 8 | 13;

function formatAfipDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function formatAfipDateDisplay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function voucherTypeLabel(voucherType: number) {
  switch (voucherType) {
    case VOUCHER_TYPE_FACTURA_B:
      return "Factura B";
    case VOUCHER_TYPE_NC_B:
      return "Nota de Credito B";
    case VOUCHER_TYPE_FACTURA_C:
      return "Factura C";
    case VOUCHER_TYPE_NC_C:
      return "Nota de Credito C";
    default:
      return `Comprobante ${voucherType}`;
  }
}

function assertSupportedFacturaType(voucherType?: number): SupportedFacturaType {
  if (voucherType === VOUCHER_TYPE_FACTURA_B || voucherType === VOUCHER_TYPE_FACTURA_C) {
    return voucherType;
  }
  return VOUCHER_TYPE_FACTURA_C;
}

function creditNoteTypeForInvoiceType(voucherType: number): SupportedCreditNoteType {
  if (voucherType === VOUCHER_TYPE_FACTURA_B) return VOUCHER_TYPE_NC_B;
  if (voucherType === VOUCHER_TYPE_FACTURA_C) return VOUCHER_TYPE_NC_C;
  throw new Error("Solo se soportan NC B y NC C en esta version");
}

function receiverVatConditionForVoucherType(voucherType: SupportedFacturaType | SupportedCreditNoteType) {
  return voucherType === VOUCHER_TYPE_FACTURA_B || voucherType === VOUCHER_TYPE_NC_B ? 5 : 5;
}

function digitsOnly(value: string | number) {
  return String(value).replace(/\D/g, "");
}

function toQrNumber(value: string | number) {
  const normalized = typeof value === "number" ? value : Number(digitsOnly(value) || "0");
  return Number.isFinite(normalized) ? normalized : 0;
}

function roundQrAmount(value: number) {
  return Math.round(value * 100) / 100;
}

async function getAfipClient(businessId: string, environment: FiscalEnvironment) {
  const { cert, key, cuit } = await loadCertAndKey(businessId, environment);
  return {
    afip: new Afip({
      CUIT: Number(cuit),
      cert,
      key,
      production: environment === "prod",
      access_token: config.afipSdkAccessToken,
    }),
    cuit,
  };
}

async function getFiscalConfig(businessId: string) {
  const { data, error } = await supabaseAdmin
    .from("business_fiscal_config")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error || !data) throw new Error("Configuracion fiscal no encontrada");
  if (!data.is_active) throw new Error("Facturacion electronica no esta activa");
  return data;
}

async function getDefaultPos(businessId: string, environment: FiscalEnvironment) {
  const { data, error } = await supabaseAdmin
    .from("fiscal_points_of_sale")
    .select("*")
    .eq("business_id", businessId)
    .eq("environment", environment)
    .eq("is_default", true)
    .maybeSingle();
  if (error || !data) throw new Error("Punto de venta no configurado");
  return data;
}

export async function testConnection(businessId: string, environment: FiscalEnvironment, voucherType?: number) {
  const { afip } = await getAfipClient(businessId, environment);
  const pos = await getDefaultPos(businessId, environment);
  const supportedType = assertSupportedFacturaType(voucherType);
  const last = await afip.ElectronicBilling.getLastVoucher(pos.pos_number, supportedType);
  return { ok: true, lastVoucherNumber: last, posNumber: pos.pos_number, voucherType: supportedType };
}

export async function getLastVoucherNumber(
  businessId: string,
  environment: FiscalEnvironment,
  voucherType: number = VOUCHER_TYPE_FACTURA_C
) {
  const { afip } = await getAfipClient(businessId, environment);
  const pos = await getDefaultPos(businessId, environment);
  const supportedType = assertSupportedFacturaType(voucherType);
  const last = await afip.ElectronicBilling.getLastVoucher(pos.pos_number, supportedType);
  return { lastVoucherNumber: last, posNumber: pos.pos_number, voucherType: supportedType };
}

function buildQrPayload(params: {
  cuit: string;
  voucherType: number;
  posNumber: number;
  voucherNumber: number;
  issueDate: string;
  total: number;
  cae: string;
  buyerDocType: number;
  buyerDocNumber: string;
  environment: FiscalEnvironment;
}) {
  const numericBuyerDoc = toQrNumber(params.buyerDocNumber || "0");
  const data: Record<string, string | number> = {
    ver: 1,
    fecha: params.issueDate,
    cuit: toQrNumber(params.cuit),
    ptoVta: params.posNumber,
    tipoCmp: params.voucherType,
    nroCmp: params.voucherNumber,
    importe: roundQrAmount(params.total),
    moneda: "PES",
    ctz: 1,
    tipoDocRec: params.buyerDocType,
    nroDocRec: numericBuyerDoc,
    tipoCodAut: "E",
    codAut: toQrNumber(params.cae),
  };
  const base64 = Buffer.from(JSON.stringify(data), "utf8").toString("base64");
  return `https://www.afip.gob.ar/fe/qr/?p=${base64}`;
}

export async function issueFiscalVoucher(params: {
  businessId: string;
  environment: FiscalEnvironment;
  saleId?: string | null;
  items: VoucherItem[];
  voucherType?: number;
  buyerDocType?: number;
  buyerDocNumber?: string;
  buyerName?: string;
  concept?: number;
}) {
  const fiscalConfig = await getFiscalConfig(params.businessId);
  const { afip, cuit } = await getAfipClient(params.businessId, params.environment);
  const pos = await getDefaultPos(params.businessId, params.environment);
  const voucherType = assertSupportedFacturaType(params.voucherType ?? fiscalConfig.default_voucher_type);

  const total = params.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const roundedTotal = Math.round(total * 100) / 100;
  const now = new Date();
  const issueDate = formatAfipDateDisplay(now);
  const buyerDocType = params.buyerDocType ?? 99;
  const buyerDocNumber = params.buyerDocNumber ?? "0";

  const voucherData = {
    CantReg: 1,
    PtoVta: pos.pos_number,
    CbteTipo: voucherType,
    Concepto: params.concept ?? 1,
    DocTipo: buyerDocType,
    DocNro: Number(buyerDocNumber.replace(/\D/g, "") || 0),
    CbteDesde: 0,
    CbteHasta: 0,
    CbteFch: formatAfipDate(now),
    ImpTotal: roundedTotal,
    ImpTotConc: 0,
    ImpNeto: roundedTotal,
    ImpOpEx: 0,
    ImpIVA: 0,
    ImpTrib: 0,
    MonId: "PES",
    MonCotiz: 1,
    CondicionIVAReceptorId: receiverVatConditionForVoucherType(voucherType),
  };

  const result = await afip.ElectronicBilling.createNextVoucher(voucherData);
  const voucherNumber = result.voucher_number;
  const cae = result.CAE;
  const caeExpires = result.CAEFchVto;
  const caeExpiresAt = `${caeExpires.slice(0, 4)}-${caeExpires.slice(4, 6)}-${caeExpires.slice(6, 8)}`;

  const qrPayload = buildQrPayload({
    cuit,
    voucherType,
    posNumber: pos.pos_number,
    voucherNumber,
    issueDate,
    total: roundedTotal,
    cae,
    buyerDocType,
    buyerDocNumber,
    environment: params.environment,
  });

  const { data: voucher, error: voucherError } = await supabaseAdmin
    .from("fiscal_vouchers")
    .insert({
      business_id: params.businessId,
      environment: params.environment,
      sale_id: params.saleId ?? null,
      voucher_type: voucherType,
      pos_number: pos.pos_number,
      voucher_number: voucherNumber,
      concept: params.concept ?? 1,
      issue_date: issueDate,
      buyer_doc_type: buyerDocType,
      buyer_doc_number: buyerDocNumber,
      buyer_name: params.buyerName ?? "Consumidor Final",
      total: roundedTotal,
      cae,
      cae_expires_at: caeExpiresAt,
      afip_result: result,
      status: "approved",
      billing_mode: fiscalConfig.billing_mode,
      qr_payload: qrPayload,
    })
    .select("id")
    .single();
  if (voucherError) throw new Error(`Error guardando comprobante: ${voucherError.message}`);

  const itemRows = params.items.map((item) => ({
    voucher_id: voucher.id,
    business_id: params.businessId,
    name: item.name,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    subtotal: Math.round(item.quantity * item.unitPrice * 100) / 100,
  }));
  await supabaseAdmin.from("fiscal_voucher_items").insert(itemRows);

  await supabaseAdmin
    .from("fiscal_points_of_sale")
    .update({
      last_authorized_numbers: {
        ...(pos.last_authorized_numbers as Record<string, number>),
        [String(voucherType)]: voucherNumber,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", pos.id);

  return {
    voucherId: voucher.id,
    voucherType,
    voucherTypeLabel: voucherTypeLabel(voucherType),
    posNumber: pos.pos_number,
    voucherNumber,
    cae,
    caeExpiresAt,
    qrPayload,
    total: roundedTotal,
  };
}

export async function issueFiscalCreditNote(params: {
  businessId: string;
  environment: FiscalEnvironment;
  originalVoucherId: string;
}) {
  const { data: original, error: originalError } = await supabaseAdmin
    .from("fiscal_vouchers")
    .select("*, fiscal_voucher_items(*)")
    .eq("id", params.originalVoucherId)
    .eq("business_id", params.businessId)
    .maybeSingle();
  if (originalError || !original) throw new Error("Comprobante original no encontrado");
  if (original.status !== "approved") throw new Error("Solo se puede emitir NC sobre comprobantes aprobados");

  const creditNoteType = creditNoteTypeForInvoiceType(original.voucher_type);
  const { afip, cuit } = await getAfipClient(params.businessId, params.environment);
  const pos = await getDefaultPos(params.businessId, params.environment);
  const total = Number(original.total);
  const now = new Date();
  const issueDate = formatAfipDateDisplay(now);

  const voucherData = {
    CantReg: 1,
    PtoVta: pos.pos_number,
    CbteTipo: creditNoteType,
    Concepto: original.concept,
    DocTipo: original.buyer_doc_type,
    DocNro: Number(String(original.buyer_doc_number).replace(/\D/g, "") || 0),
    CbteDesde: 0,
    CbteHasta: 0,
    CbteFch: formatAfipDate(now),
    ImpTotal: total,
    ImpTotConc: 0,
    ImpNeto: total,
    ImpOpEx: 0,
    ImpIVA: 0,
    ImpTrib: 0,
    MonId: "PES",
    MonCotiz: 1,
    CondicionIVAReceptorId: receiverVatConditionForVoucherType(creditNoteType),
    CbtesAsoc: [
      {
        Tipo: original.voucher_type,
        PtoVta: original.pos_number,
        Nro: original.voucher_number,
        Cuit: Number(cuit.replace(/\D/g, "")),
      },
    ],
  };

  const result = await afip.ElectronicBilling.createNextVoucher(voucherData);
  const voucherNumber = result.voucher_number;
  const cae = result.CAE;
  const caeExpires = result.CAEFchVto;
  const caeExpiresAt = `${caeExpires.slice(0, 4)}-${caeExpires.slice(4, 6)}-${caeExpires.slice(6, 8)}`;

  const qrPayload = buildQrPayload({
    cuit,
    voucherType: creditNoteType,
    posNumber: pos.pos_number,
    voucherNumber,
    issueDate,
    total,
    cae,
    buyerDocType: original.buyer_doc_type,
    buyerDocNumber: String(original.buyer_doc_number),
    environment: params.environment,
  });

  const { data: creditNote, error: creditNoteError } = await supabaseAdmin
    .from("fiscal_vouchers")
    .insert({
      business_id: params.businessId,
      environment: params.environment,
      sale_id: original.sale_id,
      voucher_type: creditNoteType,
      pos_number: pos.pos_number,
      voucher_number: voucherNumber,
      concept: original.concept,
      issue_date: issueDate,
      buyer_doc_type: original.buyer_doc_type,
      buyer_doc_number: original.buyer_doc_number,
      buyer_name: original.buyer_name,
      total,
      cae,
      cae_expires_at: caeExpiresAt,
      afip_result: result,
      status: "approved",
      billing_mode: original.billing_mode,
      qr_payload: qrPayload,
    })
    .select("id")
    .single();
  if (creditNoteError) throw new Error(`Error guardando NC: ${creditNoteError.message}`);

  const items = (original.fiscal_voucher_items ?? []) as Array<{
    name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
  if (items.length) {
    await supabaseAdmin.from("fiscal_voucher_items").insert(
      items.map((item) => ({
        voucher_id: creditNote.id,
        business_id: params.businessId,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      }))
    );
  }

  await supabaseAdmin.from("fiscal_voucher_links").insert({
    credit_note_id: creditNote.id,
    original_voucher_id: original.id,
    associated_voucher_type: original.voucher_type,
    associated_pos_number: original.pos_number,
    associated_voucher_number: original.voucher_number,
  });

  await supabaseAdmin
    .from("fiscal_vouchers")
    .update({ status: "voided_nc", updated_at: new Date().toISOString() })
    .eq("id", original.id);

  return {
    voucherId: creditNote.id,
    voucherType: creditNoteType,
    voucherTypeLabel: voucherTypeLabel(creditNoteType),
    posNumber: pos.pos_number,
    voucherNumber,
    cae,
    caeExpiresAt,
    qrPayload,
    total,
  };
}

export {
  VOUCHER_TYPE_FACTURA_B,
  VOUCHER_TYPE_NC_B,
  VOUCHER_TYPE_FACTURA_C,
  VOUCHER_TYPE_NC_C,
};
