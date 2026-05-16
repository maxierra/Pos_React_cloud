"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AuthUser, AuthResult, UserRole } from "./types";

export async function getCurrentUserWithRole(): Promise<AuthResult> {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { ok: false, error: "not_authenticated" };
  }

  if (!user.email_confirmed_at) {
    return { ok: false, error: "email_not_confirmed" };
  }

  const role = await getUserRole(user);
  const businessId = await getUserBusinessId(user.id);
  
  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email!,
      emailConfirmed: !!user.email_confirmed_at,
      role,
      businessId,
    },
  };
}

async function getUserRole(user: { id: string; email?: string }): Promise<UserRole | null> {
  const adminEmails = parsePlatformAdminEmails();
  if (adminEmails.length > 0) {
    if (user.email && adminEmails.includes(user.email.toLowerCase())) {
      return "admin";
    }
  }

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("memberships")
    .select("role, deleted_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!membership) {
    return null;
  }

  return (membership.role as UserRole) || "employee";
}

async function getUserBusinessId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("memberships")
    .select("business_id, deleted_at")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  return membership?.business_id ?? null;
}

function parsePlatformAdminEmails(): string[] {
  const raw = (process.env.PLATFORM_ADMIN_EMAILS ?? "").trim();
  if (!raw) return [];
  return raw.split(/[,;\n\r]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
}

export async function requireAuth(): Promise<AuthUser> {
  const result = await getCurrentUserWithRole();
  
  if (!result.ok) {
    redirect("/auth/login");
  }
  
  return result.user;
}

export async function requireRole(requiredRole: UserRole): Promise<AuthUser> {
  const user = await requireAuth();
  
  if (user.role !== requiredRole && !(requiredRole === "admin" && user.role === "owner")) {
    redirect("/unauthorized");
  }
  
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  
  if (user.role !== "admin") {
    redirect("/unauthorized");
  }
  
  return user;
}

export async function requirePOSAccess(): Promise<AuthUser> {
  const user = await requireAuth();
  
  if (user.role !== "owner" && user.role !== "employee") {
    redirect("/auth/login");
  }
  
  return user;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}