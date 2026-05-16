import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@supabase/ssr";
import { getAppBaseUrl } from "@/lib/app-base-url";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const appBaseUrl = getAppBaseUrl();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/app";

  const redirectTo = type === "recovery" ? "/auth/update-password" : next;
  const response = NextResponse.redirect(new URL(redirectTo, appBaseUrl));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, appBaseUrl)
      );
    }
    return response;
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash: tokenHash,
    });
    if (error) {
      return NextResponse.redirect(
        new URL(`/auth/reset?error=${encodeURIComponent(error.message)}`, appBaseUrl)
      );
    }
    return response;
  }

  return NextResponse.redirect(new URL("/auth/login", appBaseUrl));
}
