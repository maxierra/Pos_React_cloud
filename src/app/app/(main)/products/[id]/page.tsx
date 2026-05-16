import Link from "next/link";
import { cookies } from "next/headers";

import { updateProduct } from "@/app/app/(main)/products/actions";
import { ProductForm } from "@/app/app/(main)/products/product-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

type ProductRow = {
  id: string;
  name: string;
  barcode: string | null;
  scale_code: string | null;
  category: string | null;
  price: number;
  cost: number;
  expires_at: string | null;
  sold_by_weight: boolean;
  stock: number;
  stock_decimal: number;
  low_stock_threshold: number;
  low_stock_threshold_decimal: number;
  active: boolean;
};

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;

  if (!businessId) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Editar producto</CardTitle>
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
      "id,name,barcode,scale_code,category,price,cost,expires_at,sold_by_weight,stock,stock_decimal,low_stock_threshold,low_stock_threshold_decimal,active"
    )
    .eq("id", id)
    .eq("business_id", businessId)
    .single();

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Editar producto</CardTitle>
            <CardDescription>No se encontró el producto.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link className="text-sm underline" href="/app/products">
              Volver a productos
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const p = data as ProductRow;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Editar producto</h1>
        <p className="text-sm text-muted-foreground">Actualizá precios, stock y configuración.</p>
      </div>

      <div className="mt-6 grid gap-6">
        <ProductForm
          title={p.name}
          description="El precio de venta se recalcula en base a costo y margen."
          defaults={p}
          action={updateProduct}
        />

        <div>
          <Link className="text-sm text-muted-foreground underline" href="/app/products">
            Volver a productos
          </Link>
        </div>
      </div>
    </div>
  );
}
