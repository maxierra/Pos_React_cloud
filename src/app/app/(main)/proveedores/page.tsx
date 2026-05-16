import Link from "next/link";
import { cookies } from "next/headers";

import { ProveedoresClient, type SupplierRow } from "@/app/app/(main)/proveedores/proveedores-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function ProveedoresPage() {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;

  if (!businessId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Proveedores</CardTitle>
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
  const { data: suppliersData } = await supabase
    .from("business_suppliers")
    .select("id,name,phone,email,address,tax_id,notes,created_at")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  const suppliers = (suppliersData ?? []) as SupplierRow[];
  const ids = suppliers.map((s) => s.id);
  const orderCounts: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: oc } = await supabase
      .from("supplier_orders")
      .select("supplier_id")
      .eq("business_id", businessId)
      .in("supplier_id", ids);
    for (const r of oc ?? []) {
      const sid = String((r as { supplier_id: string }).supplier_id);
      orderCounts[sid] = (orderCounts[sid] ?? 0) + 1;
    }
  }

  return <ProveedoresClient suppliers={suppliers} orderCounts={orderCounts} />;
}
