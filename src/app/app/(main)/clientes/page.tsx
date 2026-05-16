import Link from "next/link";
import { cookies } from "next/headers";

import { ClientesClient, type ClienteRow } from "@/app/app/(main)/clientes/clientes-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

function toNum(v: unknown) {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export default async function ClientesPage() {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;

  if (!businessId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>Seleccioná un negocio primero.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link className="text-sm underline" href="/app/setup">
              Ir a configuración
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();

  const [{ data: customers }, { data: ccSales }, { data: payments }] = await Promise.all([
    supabase
      .from("business_customers")
      .select("id,name,phone,email,address,credit_limit")
      .eq("business_id", businessId)
      .order("name", { ascending: true }),
    supabase
      .from("sales")
      .select("customer_id,total")
      .eq("business_id", businessId)
      .eq("payment_method", "cuenta_corriente")
      .eq("status", "paid")
      .not("customer_id", "is", null),
    supabase.from("customer_account_payments").select("customer_id,amount").eq("business_id", businessId),
  ]);

  const charges = new Map<string, number>();
  for (const s of ccSales ?? []) {
    const id = String((s as { customer_id: string | null }).customer_id ?? "");
    if (!id) continue;
    charges.set(id, (charges.get(id) ?? 0) + toNum((s as { total: unknown }).total));
  }

  const pays = new Map<string, number>();
  for (const p of payments ?? []) {
    const id = String((p as { customer_id: string }).customer_id ?? "");
    if (!id) continue;
    pays.set(id, (pays.get(id) ?? 0) + toNum((p as { amount: unknown }).amount));
  }

  const rows: ClienteRow[] = (customers ?? []).map((c: Record<string, unknown>) => {
    const id = String(c.id ?? "");
    const ch = charges.get(id) ?? 0;
    const py = pays.get(id) ?? 0;
    const creditLimit = toNum(c.credit_limit);
    const balance = Math.round((ch - py + Number.EPSILON) * 100) / 100;
    const available = Math.max(0, Math.round((creditLimit - balance + Number.EPSILON) * 100) / 100);
    return {
      id,
      name: String(c.name ?? ""),
      phone: c.phone != null ? String(c.phone) : null,
      email: c.email != null ? String(c.email) : null,
      address: c.address != null ? String(c.address) : null,
      credit_limit: creditLimit,
      balance,
      available_to_spend: available,
    };
  });

  return <ClientesClient rows={rows} />;
}
