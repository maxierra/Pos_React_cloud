import Link from "next/link";
import { cookies } from "next/headers";

import { ProductsClient } from "@/app/app/(main)/products/products-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type ProductRow = {
  id: string;
  name: string;
  barcode: string | null;
  scale_code: string | null;
  category: string | null;
  price: string | number;
  cost: string | number;
  sold_by_weight: boolean;
  stock: number;
  stock_decimal: string | number;
  low_stock_threshold: number;
  low_stock_threshold_decimal: string | number;
  expires_at: string | null;
  active: boolean;
};

export default async function ProductsPage() {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;

  if (!businessId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
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
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id ?? null;
  const { data } = await supabase
    .from("products")
    .select(
      "id,name,barcode,scale_code,category,price,cost,sold_by_weight,stock,stock_decimal,low_stock_threshold,low_stock_threshold_decimal,expires_at,active"
    )
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(100);

  const products = (data ?? []) as ProductRow[];

  let canEditPrice = true;
  let canEditStock = true;
  if (userId) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("role,permissions")
      .eq("user_id", userId)
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .maybeSingle();
    const role = (membership as any)?.role as string | null;
    const perms = ((membership as any)?.permissions ?? {}) as Record<string, unknown>;
    if (role !== "owner") {
      canEditPrice = perms.products_edit_price === true;
      canEditStock = perms.products_edit_stock === true;
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
        <p className="text-sm text-muted-foreground">Alta, edición y control de stock.</p>
      </div>

      <ProductsClient products={products} canEditPrice={canEditPrice} canEditStock={canEditStock} />
    </div>
  );
}
