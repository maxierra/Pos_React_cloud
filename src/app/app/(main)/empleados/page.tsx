import Link from "next/link";
import { cookies } from "next/headers";

import { EmpleadosClient, type ActivityEventRow, type MemberEmailRow } from "@/app/app/(main)/empleados/empleados-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function EmpleadosPage() {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;

  if (!businessId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Empleados</CardTitle>
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
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const { data: eventsData, error: evErr } = await supabase
    .from("business_activity_events")
    .select("id,user_id,kind,summary,metadata,entity_type,entity_id,created_at")
    .eq("business_id", businessId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(2000);

  if (evErr) {
    console.warn("[empleados] business_activity_events:", evErr.message);
  }

  const { data: emailsData, error: emailsErr } = await supabase.rpc("business_member_emails", {
    p_business_id: businessId,
  });

  if (emailsErr) {
    console.warn("[empleados] business_member_emails:", emailsErr.message);
  }

  const events = (eventsData ?? []) as ActivityEventRow[];
  const memberEmails = (emailsData ?? []) as MemberEmailRow[];

  return (
    <EmpleadosClient
      events={events}
      memberEmails={memberEmails}
      loadError={evErr?.message ?? emailsErr?.message ?? null}
    />
  );
}
