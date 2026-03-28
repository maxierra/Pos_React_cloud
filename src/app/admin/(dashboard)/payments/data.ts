import { createAdminClient } from "@/lib/supabase/admin";

export type PaymentWithBusiness = {
  id: string;
  business_id: string;
  business_name: string | null;
  provider: string;
  provider_payment_id: string | null;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
};

export async function getPlatformPayments(limit = 100): Promise<PaymentWithBusiness[]> {
  const adminClient = createAdminClient();

  // Fetches payments and joins with businesses to get the business name
  const { data, error } = await adminClient
    .from("payments")
    .select(`
      id,
      business_id,
      provider,
      provider_payment_id,
      amount,
      currency,
      status,
      created_at,
      businesses ( name )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch platform payments:", error);
    return [];
  }

  // Flatten the relation
  return (data || []).map((row: any) => ({
    id: row.id,
    business_id: row.business_id,
    business_name: row.businesses?.name ?? "Negocio Desconocido",
    provider: row.provider,
    provider_payment_id: row.provider_payment_id,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    created_at: row.created_at,
  }));
}
