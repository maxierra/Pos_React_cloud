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

  const { data: customers, error: customersError } = await supabase
    .from("business_customers")
    .select("id,name,phone,email,address,credit_limit")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (customersError) throw customersError;

  const balances = await Promise.all(
    (customers ?? []).map(async (customer) => {
      const { data, error } = await supabase.rpc("customer_balance", { p_customer_id: customer.id });
      if (error) throw error;
      return [customer.id, toNum(data)] as const;
    })
  );
  const balancesByCustomer = new Map(balances);

  const rows: ClienteRow[] = (customers ?? []).map((c: Record<string, unknown>) => {
    const id = String(c.id ?? "");
    const creditLimit = toNum(c.credit_limit);
    const balance = balancesByCustomer.get(id) ?? 0;
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
