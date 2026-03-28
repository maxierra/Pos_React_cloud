import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "@/app/app/(main)/settings/settings-client";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const businessId = cookieStore.get("active_business_id")?.value;

  let business: {
    name: string;
    address: string | null;
    phone: string | null;
    cuit: string | null;
    ticket_header: string | null;
    ticket_footer: string | null;
    report_daily_enabled: boolean;
    report_daily_email: string | null;
    report_daily_time: string | null;
  } | null = null;

  if (businessId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("businesses")
      .select("name,address,phone,cuit,ticket_header,ticket_footer,report_daily_enabled,report_daily_email,report_daily_time")
      .eq("id", businessId)
      .single();

    if (data) {
      business = data as unknown as typeof business;
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="mt-1 text-sm text-muted-foreground">Preferencias del negocio y del sistema.</p>
      </div>

      <div className="grid gap-6">
        <SettingsClient defaults={business ?? undefined} />
      </div>
    </div>
  );
}
