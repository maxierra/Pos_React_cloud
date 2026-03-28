"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createMonitoredAction } from "@/lib/action-wrapper";
import { createClient } from "@/lib/supabase/server";
import { emailIsPlatformAdmin } from "@/lib/platform-admin";

async function adminSignInImpl(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const hasSupabaseEnv = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

  if (!hasSupabaseEnv) {
    redirect(`/admin/login?error=${encodeURIComponent("Falta configurar Supabase")}`);
  }

  // Pre-validate email so only admins can even try to log in here
  if (!emailIsPlatformAdmin(email)) {
    redirect(`/admin/login?error=${encodeURIComponent("No tienes permisos de administrador de plataforma.")}`);
  }

  const supabase = await createClient();
  const { error, data: authData } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  }

  const user = authData.user;
  if (!user?.id || !emailIsPlatformAdmin(user.email)) {
    await supabase.auth.signOut();
    redirect(`/admin/login?error=${encodeURIComponent("Acceso denegado.")}`);
  }

  redirect("/admin");
}

async function adminSignOutImpl() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export const adminSignIn = createMonitoredAction(adminSignInImpl, "admin/signIn");
export const adminSignOut = createMonitoredAction(adminSignOutImpl, "admin/signOut");
