"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { createMonitoredAction } from "@/lib/action-wrapper";
import { createClient } from "@/lib/supabase/server";

async function saveCustomerImpl(input: {
  id?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  credit_limit: number;
}) {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;
  if (!businessId) throw new Error("missing_active_business_id");

  const name = input.name.trim();
  if (!name) throw new Error("missing_name");

  const supabase = await createClient();

  if (input.id) {
    const { error } = await supabase
      .from("business_customers")
      .update({
        name,
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        address: input.address?.trim() || null,
        credit_limit: input.credit_limit,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .eq("business_id", businessId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("business_customers").insert({
      business_id: businessId,
      name,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      credit_limit: input.credit_limit,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/app/clientes");
  revalidatePath("/app/pos");
}

async function deleteCustomerImpl(customerId: string) {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;
  if (!businessId) throw new Error("missing_active_business_id");

  const supabase = await createClient();
  const { data: bal, error: balErr } = await supabase.rpc("customer_balance", { p_customer_id: customerId });
  if (balErr) throw new Error(balErr.message);
  const n = typeof bal === "number" ? bal : Number(bal);
  if (Number.isFinite(n) && n > 0.01) {
    throw new Error("no_se_puede_eliminar_con_deuda");
  }

  const { error } = await supabase
    .from("business_customers")
    .delete()
    .eq("id", customerId)
    .eq("business_id", businessId);
  if (error) throw new Error(error.message);

  revalidatePath("/app/clientes");
  revalidatePath("/app/pos");
}

async function recordCustomerPaymentImpl(input: {
  customer_id: string;
  amount: number;
  payment_method: "cash" | "card" | "transfer" | "mercadopago";
  notes?: string | null;
}) {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;
  if (!businessId) throw new Error("missing_active_business_id");

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_customer_account_payment", {
    p_business_id: businessId,
    p_customer_id: input.customer_id,
    p_amount: input.amount,
    p_payment_method: input.payment_method,
    p_payment_details: null,
    p_notes: input.notes ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/app/clientes");
  revalidatePath("/app/cash");
}

export const saveCustomer = createMonitoredAction(saveCustomerImpl, "clientes/saveCustomer");
export const deleteCustomer = createMonitoredAction(deleteCustomerImpl, "clientes/deleteCustomer");
export const recordCustomerPayment = createMonitoredAction(recordCustomerPaymentImpl, "clientes/recordCustomerPayment");

export type CustomerLedgerTimelineSale = {
  kind: "sale";
  key: string;
  saleId: string;
  at: string;
  amount: number;
  items: Array<{ name: string; quantity: number; lineTotal: number }>;
};

export type CustomerLedgerTimelinePayment = {
  kind: "payment";
  key: string;
  at: string;
  amount: number;
  method: string;
  notes: string | null;
};

export type CustomerLedgerData = {
  customerId: string;
  name: string;
  credit_limit: number;
  balance: number;
  timeline: Array<CustomerLedgerTimelineSale | CustomerLedgerTimelinePayment>;
};

function toNum(value: unknown) {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** Historial de compras (CC) y cobros para el modal del cliente. */
export async function getCustomerLedger(customerId: string): Promise<CustomerLedgerData> {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;
  if (!businessId) throw new Error("missing_active_business_id");

  const supabase = await createClient();

  const { data: customer, error: cErr } = await supabase
    .from("business_customers")
    .select("id,name,credit_limit")
    .eq("id", customerId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (cErr) throw new Error(cErr.message);
  if (!customer) throw new Error("customer_not_found");

  const { data: balanceRaw, error: bErr } = await supabase.rpc("customer_balance", { p_customer_id: customerId });
  if (bErr) throw new Error(bErr.message);
  const balance = toNum(balanceRaw);

  const { data: sales, error: sErr } = await supabase
    .from("sales")
    .select("id,total,created_at,status")
    .eq("business_id", businessId)
    .eq("customer_id", customerId)
    .eq("payment_method", "cuenta_corriente")
    .order("created_at", { ascending: false })
    .limit(200);

  if (sErr) throw new Error(sErr.message);

  const saleIds = (sales ?? []).map((s) => s.id as string);
  const { data: saleItems, error: iErr } =
    saleIds.length > 0
      ? await supabase.from("sale_items").select("sale_id,name,quantity,unit_price,total").in("sale_id", saleIds)
      : { data: [], error: null };

  if (iErr) throw new Error(iErr.message);

  const itemsBySale = new Map<string, Array<{ name: string; quantity: number; lineTotal: number }>>();
  for (const it of saleItems ?? []) {
    const row = it as Record<string, unknown>;
    const sid = String(row.sale_id ?? "");
    if (!itemsBySale.has(sid)) itemsBySale.set(sid, []);
    itemsBySale.get(sid)?.push({
      name: String(row.name ?? ""),
      quantity: toNum(row.quantity),
      lineTotal: toNum(row.total),
    });
  }

  const { data: payments, error: pErr } = await supabase
    .from("customer_account_payments")
    .select("id,amount,payment_method,created_at,notes")
    .eq("business_id", businessId)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (pErr) throw new Error(pErr.message);

  const timeline: CustomerLedgerData["timeline"] = [];

  for (const s of sales ?? []) {
    const row = s as Record<string, unknown>;
    if (String(row.status ?? "") !== "paid") continue;
    const id = String(row.id ?? "");
    timeline.push({
      kind: "sale",
      key: `sale-${id}`,
      saleId: id,
      at: String(row.created_at ?? ""),
      amount: toNum(row.total),
      items: itemsBySale.get(id) ?? [],
    });
  }

  for (const p of payments ?? []) {
    const row = p as Record<string, unknown>;
    timeline.push({
      kind: "payment",
      key: `pay-${String(row.id ?? "")}`,
      at: String(row.created_at ?? ""),
      amount: toNum(row.amount),
      method: String(row.payment_method ?? ""),
      notes: row.notes != null ? String(row.notes) : null,
    });
  }

  timeline.sort((a, b) => (a.at < b.at ? 1 : -1));

  return {
    customerId: String(customer.id),
    name: String(customer.name ?? ""),
    credit_limit: toNum(customer.credit_limit),
    balance,
    timeline,
  };
}
