import { createAdminClient } from "@/lib/supabase/admin";
import { issueFiscalVoucher } from "@/features/billing/fiscal-client";
import { defaultFiscalVoucherTypeForTaxCondition, type TaxCondition } from "@/features/billing/types";

type SaleItemRow = {
  name: string | null;
  quantity: number | string | null;
  unit_price: number | string | null;
};

function toNumber(value: number | string | null | undefined) {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function emitFiscalVoucherForRecordedSale(params: {
  businessId: string;
  saleId: string;
}) {
  const admin = createAdminClient();

  const [{ data: config }, { data: existingVoucher }, { data: saleItems, error: itemsError }] = await Promise.all([
    admin.from("business_fiscal_config").select("*").eq("business_id", params.businessId).maybeSingle(),
    admin
      .from("fiscal_vouchers")
      .select("id,status")
      .eq("business_id", params.businessId)
      .eq("sale_id", params.saleId)
      .eq("status", "approved")
      .maybeSingle(),
    admin
      .from("sale_items")
      .select("name,quantity,unit_price")
      .eq("business_id", params.businessId)
      .eq("sale_id", params.saleId),
  ]);

  if (!config?.is_active || config.billing_mode !== "per_sale") {
    return null;
  }

  if (existingVoucher?.id) {
    return { skipped: "already_approved" as const };
  }

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const items = ((saleItems ?? []) as SaleItemRow[])
    .map((item) => ({
      name: String(item.name ?? "Producto"),
      quantity: toNumber(item.quantity),
      unitPrice: toNumber(item.unit_price),
    }))
    .filter((item) => item.quantity > 0);

  if (items.length === 0) {
    throw new Error("La venta no tiene ítems para emitir ARCA");
  }

  const taxCondition = (config.tax_condition as TaxCondition | null) ?? "monotributo";
  const defaultVoucherType =
    Number((config as { default_voucher_type?: number | null }).default_voucher_type) ||
    defaultFiscalVoucherTypeForTaxCondition(taxCondition);

  return issueFiscalVoucher({
    businessId: params.businessId,
    environment: config.environment as "homolog" | "prod",
    saleId: params.saleId,
    items,
    voucherType: defaultVoucherType,
    concept: 1,
  });
}
