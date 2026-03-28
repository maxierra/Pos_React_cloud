import { cookies, headers } from "next/headers";

import { createServerClient } from "@supabase/ssr";

function parseCookieHeader(cookieHeader: string) {
  return cookieHeader
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((part) => {
      const eq = part.indexOf("=");
      if (eq === -1) return { name: part, value: "" };
      const name = part.slice(0, eq).trim();
      const value = part.slice(eq + 1);
      return { name, value: decodeURIComponent(value) };
    });
}

export async function createClient() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const anyStore = cookieStore as unknown as {
            getAll?: () => { name: string; value: string }[];
          };

          if (typeof anyStore.getAll === "function") {
            return anyStore.getAll();
          }

          const raw = headerStore.get("cookie") ?? "";
          return parseCookieHeader(raw);
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              (cookieStore as unknown as { set?: (n: string, v: string, o?: any) => void }).set?.(
                name,
                value,
                options
              );
            });
          } catch {
            // noop
          }
        },
      },
    }
  );
}
