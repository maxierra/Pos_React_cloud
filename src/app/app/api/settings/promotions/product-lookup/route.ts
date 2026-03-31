import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });
  }

  const url = new URL(request.url);
  const code = (url.searchParams.get("code") ?? "").trim();

  const cookies = await import("next/headers").then((m) => m.cookies());
  const businessId = cookies.get("active_business_id")?.value;
  if (!businessId) {
    return NextResponse.json({ error: "No hay negocio activo" }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "Falta código o texto" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("products")
    .select("id,name,barcode")
    .eq("business_id", businessId)
    .or(`barcode.eq.${code},name.ilike.%${code.replace(/%/g, "").replace(/_/g, "")}%`)
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    name: data.name,
    barcode: data.barcode,
  });
}

