import { redirect } from "next/navigation";

import { AdminShell } from "@/app/admin/(dashboard)/admin-shell";
import { createClient } from "@/lib/supabase/server";
import { emailIsPlatformAdmin } from "@/lib/platform-admin";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;

  if (!email || !emailIsPlatformAdmin(email)) {
    redirect("/admin/login?error=Acceso+denegado");
  }

  return (
    <AdminShell user={{ email }}>
      {children}
    </AdminShell>
  );
}
