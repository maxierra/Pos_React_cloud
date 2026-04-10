import { createClient } from "@/lib/supabase/server";
import { emailIsPlatformAdmin } from "@/lib/platform-admin";

/**
 * Email del usuario actual si está en PLATFORM_ADMIN_EMAILS.
 * Usa getUser() y, si hace falta, getSession() (en algunos server actions el JWT llega mejor por sesión).
 */
export async function getPlatformAdminSessionEmail(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let email = user?.email ?? null;
  if (!email) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    email = session?.user?.email ?? null;
  }
  if (!email || !emailIsPlatformAdmin(email)) return null;
  return email.trim().toLowerCase();
}
