import Link from "next/link";
import { cookies } from "next/headers";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { InventoryClient, type InventoryProductRow } from "@/app/app/(main)/inventory/inventory-client";

export default async function InventoryPage() {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;

  if (!businessId) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Inventario</CardTitle>
            <CardDescription>Primero tenés que crear o seleccionar un negocio.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link className="text-sm underline" href="/app/setup">
              Ir a /app/setup
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,name,sku,barcode,scale_code,category,price,cost,sold_by_weight,stock,stock_decimal,low_stock_threshold,low_stock_threshold_decimal,expires_at,active,created_at"
    )
    .eq("business_id", businessId)
    .order("name", { ascending: true })
    .limit(1500);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Inventario</CardTitle>
            <CardDescription>No se pudieron cargar los productos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">{error.message}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const products = (data ?? []) as InventoryProductRow[];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Inventario</h1>
        <p className="text-sm text-muted-foreground">Stock, alertas por poco stock y vencimientos.</p>
      </div>

      <InventoryClient products={products} />
    </div>
  );
}
