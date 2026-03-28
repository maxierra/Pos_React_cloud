import Link from "next/link";
import { cookies } from "next/headers";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { PosClient, type PosProduct } from "@/app/app/(main)/pos/pos-client";

export default async function PosPage() {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;

  if (!businessId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Punto de venta</CardTitle>
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
  const { data: businessData } = await supabase
    .from("businesses")
    .select("name,address,phone,cuit,ticket_header,ticket_footer")
    .eq("id", businessId)
    .single();

  const { data } = await supabase
    .from("products")
    .select("id,name,price,barcode,scale_code,sold_by_weight,stock,stock_decimal")
    .eq("business_id", businessId)
    .eq("active", true)
    .order("name", { ascending: true })
    .limit(500);

  const products = ((data ?? []) as any[]).map(
    (p): PosProduct => ({
      id: String(p.id),
      name: String(p.name),
      price: Number(p.price) || 0,
      barcode: (p as any).barcode ? String((p as any).barcode) : null,
      scale_code: (p as any).scale_code ? String((p as any).scale_code) : null,
      sold_by_weight: Boolean(p.sold_by_weight),
      stock: Number(p.stock) || 0,
      stock_decimal: Number(p.stock_decimal) || 0,
    })
  );

  const business = businessData
    ? {
        name: String((businessData as any).name ?? ""),
        address: ((businessData as any).address as string | null) ?? null,
        phone: ((businessData as any).phone as string | null) ?? null,
        cuit: ((businessData as any).cuit as string | null) ?? null,
        ticket_header: ((businessData as any).ticket_header as string | null) ?? null,
        ticket_footer: ((businessData as any).ticket_footer as string | null) ?? null,
      }
    : null;

  const { data: openRegister } = await supabase
    .from("cash_registers")
    .select("id")
    .eq("business_id", businessId)
    .is("closed_at", null)
    .order("opened_at", { ascending: false })
    .limit(1)
    .single();

  const cashOpen = !!openRegister;

  return <PosClient products={products} business={business} cashOpen={cashOpen} />;
}
