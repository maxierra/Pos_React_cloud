import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { FacturacionClient } from "@/app/app/(main)/facturacion/facturacion-client";
import { getFiscalVouchers, getPendingConsolidationSummary, type PendingConsolidationRow } from "@/app/app/(main)/facturacion/actions";
import type { FiscalVoucher } from "@/features/billing/types";
import type { PosBusinessInfo } from "@/lib/ticket-utils";

export default async function FacturacionPage() {
  const businessId = (await cookies()).get("active_business_id")?.value;
  let fiscalActive = false;
  let vouchers: FiscalVoucher[] = [];
  let business: PosBusinessInfo = null;
  let consolidation: {
    billingMode: "per_sale" | "consolidated" | null;
    pending: PendingConsolidationRow[];
    byPeriod: Record<string, number>;
  } = { billingMode: null, pending: [], byPeriod: {} };

  if (businessId) {
    const supabase = await createClient();
    const [{ data: config }, { data: businessRow }] = await Promise.all([
      supabase
      .from("business_fiscal_config")
      .select("is_active,iibb,activity_start_date")
      .eq("business_id", businessId)
      .maybeSingle(),
      supabase
        .from("businesses")
        .select("name,address,phone,cuit,ticket_header,ticket_footer")
        .eq("id", businessId)
        .maybeSingle(),
    ]);
    fiscalActive = Boolean(config?.is_active);
    if (businessRow) {
      business = {
        name: (businessRow as { name?: string | null }).name ?? "Mi negocio",
        address: (businessRow as { address?: string | null }).address ?? null,
        phone: (businessRow as { phone?: string | null }).phone ?? null,
        cuit: (businessRow as { cuit?: string | null }).cuit ?? null,
        iibb: (config as { iibb?: string | null } | null)?.iibb ?? null,
        activity_start_date: (config as { activity_start_date?: string | null } | null)?.activity_start_date ?? null,
        ticket_header: (businessRow as { ticket_header?: string | null }).ticket_header ?? null,
        ticket_footer: (businessRow as { ticket_footer?: string | null }).ticket_footer ?? null,
      };
    }
    vouchers = await getFiscalVouchers();
    try {
      consolidation = await getPendingConsolidationSummary();
    } catch {
      /* tablas fiscales aún no migradas */
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 border-b border-border/60 pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Comprobantes electrónicos emitidos vía ARCA (AFIP). CAE, vencimiento y notas de crédito.
        </p>
      </div>
      <FacturacionClient
        vouchers={vouchers}
        fiscalActive={fiscalActive}
        billingMode={consolidation.billingMode}
        pendingConsolidation={consolidation.pending}
        pendingByPeriod={consolidation.byPeriod}
        business={business}
      />
    </div>
  );
}
