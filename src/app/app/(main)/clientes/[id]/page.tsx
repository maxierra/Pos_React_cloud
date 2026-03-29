import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { ClienteDetalleClient } from "@/app/app/(main)/clientes/cliente-detalle-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function ClienteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = await params;
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;

  if (!businessId) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
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

  const { data: customer, error: cErr } = await supabase
    .from("business_customers")
    .select("id,name,phone,email,address,credit_limit")
    .eq("id", customerId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (cErr || !customer) notFound();

  const { data: balanceRaw } = await supabase.rpc("customer_balance", { p_customer_id: customerId });
  const balance =
    typeof balanceRaw === "number" ? balanceRaw : Number(balanceRaw ?? 0);

  const { data: sales } = await supabase
    .from("sales")
    .select("id,total,created_at,status")
    .eq("business_id", businessId)
    .eq("customer_id", customerId)
    .eq("payment_method", "cuenta_corriente")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: pays } = await supabase
    .from("customer_account_payments")
    .select("id,amount,payment_method,created_at,notes")
    .eq("business_id", businessId)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <ClienteDetalleClient
      customer={{
        id: String(customer.id),
        name: String(customer.name ?? ""),
        phone: customer.phone != null ? String(customer.phone) : null,
        email: customer.email != null ? String(customer.email) : null,
        address: customer.address != null ? String(customer.address) : null,
        credit_limit: Number(customer.credit_limit) || 0,
        balance: Number.isFinite(balance) ? balance : 0,
      }}
      sales={(sales ?? []) as Array<{ id: string; total: number | string; created_at: string; status: string }>}
      payments={
        (pays ?? []) as Array<{
          id: string;
          amount: number | string;
          payment_method: string;
          created_at: string;
          notes: string | null;
        }>
      }
    />
  );
}
