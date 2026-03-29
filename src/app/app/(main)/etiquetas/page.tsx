import Link from "next/link";
import { cookies } from "next/headers";

import { EtiquetasClient } from "@/app/app/(main)/etiquetas/etiquetas-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function EtiquetasPage() {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;

  if (!businessId) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Etiquetas</CardTitle>
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
  const { data: biz } = await supabase.from("businesses").select("name").eq("id", businessId).maybeSingle();

  return <EtiquetasClient businessName={(biz as { name?: string } | null)?.name ?? "Mi negocio"} />;
}
