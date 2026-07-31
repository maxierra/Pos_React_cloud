export type FiscalEnvironment = "homolog" | "prod";

export type FiscalBillingMode = "per_sale" | "consolidated";
export type FiscalDocumentOutputMode = "ticket" | "factura";

export type TaxCondition = "monotributo" | "ri";

export type FiscalCustomerTaxCondition = "consumidor_final" | "monotributista" | "ri" | "exento";

export type FiscalCustomerData = {
  taxCondition: FiscalCustomerTaxCondition;
  documentType: "dni" | "cuit";
  documentNumber: string;
  name: string;
};

export type FiscalVoucherStatus = "pending" | "approved" | "rejected" | "voided_nc";

export type FiscalCertificateStatus = "pending_upload" | "active" | "expired" | "revoked";

export type BusinessFiscalConfig = {
  id: string;
  business_id: string;
  tax_condition: TaxCondition;
  cuit: string | null;
  razon_social: string | null;
  domicilio_fiscal: string | null;
  iibb: string | null;
  activity_start_date: string | null;
  environment: FiscalEnvironment;
  billing_mode: FiscalBillingMode;
  document_output_mode: FiscalDocumentOutputMode;
  default_voucher_type: number;
  is_active: boolean;
  last_sync_at: string | null;
};

export type FiscalPointOfSale = {
  id: string;
  business_id: string;
  environment: FiscalEnvironment;
  pos_number: number;
  voucher_types: number[];
  is_default: boolean;
  last_authorized_numbers: Record<string, number>;
};

export type FiscalCertificate = {
  id: string;
  business_id: string;
  environment: FiscalEnvironment;
  cuit: string;
  status: FiscalCertificateStatus;
  issued_at: string | null;
  expires_at: string | null;
};

export type FiscalVoucher = {
  id: string;
  business_id: string;
  environment: FiscalEnvironment;
  sale_id: string | null;
  voucher_type: number;
  pos_number: number;
  voucher_number: number;
  issue_date: string;
  buyer_name: string | null;
  buyer_doc_number: string;
  total: number;
  cae: string | null;
  cae_expires_at: string | null;
  status: FiscalVoucherStatus;
  billing_mode: FiscalBillingMode;
  qr_payload: string | null;
  rejection_reason: string | null;
  created_at: string;
  fiscal_voucher_items?: FiscalVoucherItem[];
};

export type FiscalVoucherItem = {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export type IssueVoucherResult = {
  voucherId: string;
  voucherType: number;
  voucherTypeLabel: string;
  posNumber: number;
  voucherNumber: number;
  cae: string;
  caeExpiresAt: string;
  qrPayload: string;
  total: number;
};

export type FiscalVoucherOption = {
  type: number;
  label: string;
  description: string;
  recommended?: boolean;
};

export const VOUCHER_TYPE_LABELS: Record<number, string> = {
  6: "Factura B",
  7: "Nota de Debito B",
  8: "Nota de Credito B",
  11: "Factura C",
  12: "Nota de Debito C",
  13: "Nota de Credito C",
};

export const MONOTRIBUTO_VOUCHER_OPTIONS: FiscalVoucherOption[] = [
  {
    type: 11,
    label: "Factura C",
    description: "La factura que emitis en cada venta del POS.",
    recommended: true,
  },
  {
    type: 12,
    label: "Nota de Debito C",
    description: "Para sumar una diferencia o recargo sobre una Factura C ya emitida.",
  },
  {
    type: 13,
    label: "Nota de Credito C",
    description: "Para anular o corregir una Factura C ya emitida.",
  },
];

export const RESPONSABLE_INSCRIPTO_VOUCHER_OPTIONS: FiscalVoucherOption[] = [
  {
    type: 6,
    label: "Factura B",
    description: "Se usa para consumidor final. Si el cliente tiene perfil fiscal valido, el flujo tambien puede derivar en Factura A.",
    recommended: true,
  },
  {
    type: 7,
    label: "Nota de Debito B",
    description: "Para sumar una diferencia o recargo sobre una Factura B emitida desde el POS.",
  },
  {
    type: 8,
    label: "Nota de Credito B",
    description: "Para anular o corregir una Factura B emitida desde el POS.",
  },
];

export function voucherOptionsForTaxCondition(taxCondition: TaxCondition): FiscalVoucherOption[] {
  return taxCondition === "ri" ? RESPONSABLE_INSCRIPTO_VOUCHER_OPTIONS : MONOTRIBUTO_VOUCHER_OPTIONS;
}

export function defaultFiscalVoucherTypeForTaxCondition(taxCondition: TaxCondition): number {
  return taxCondition === "ri" ? 6 : 11;
}

export function voucherTypeLabel(type: number): string {
  return VOUCHER_TYPE_LABELS[type] ?? `Comprobante ${type}`;
}
