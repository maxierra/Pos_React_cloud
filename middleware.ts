import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { updateSession } from "@/lib/supabase/middleware";
import { businessHasAppAccess, type SubscriptionRow } from "@/lib/subscription";

const PROTECTED_PREFIXES = ["/app", "/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasSupabaseEnv =
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().length > 0 &&
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim().length > 0;

  const demoEnabled = process.env.DEMO_AUTH_ENABLED === "1";
  const hasDemoSession = request.cookies.get("demo_auth")?.value === "1";

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) {
    const { response } = await updateSession(request);
    return response;
  }

  if (!hasSupabaseEnv) {
    if (demoEnabled && hasDemoSession) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("missingSupabase", "1");
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  /**
   * Un solo createServerClient: primero getUser() (refresca JWT en cookies del request),
   * después memberships y subscriptions. Dos clientes distintos rompían la sesión en Edge
   * y la query a subscriptions volvía vacía → businessHasAppAccess(null) === true.
   */
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user.email_confirmed_at == null) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set(
      "error",
      "Confirmá tu correo para entrar. Revisá tu bandeja (y spam) y tocá el enlace del mail.",
    );
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/app")) {
    const { data: memberships, error: memErr } = await supabase
      .from("memberships")
      .select("business_id, deleted_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (memErr && process.env.NODE_ENV === "development") {
      console.warn("[middleware] memberships", memErr.message);
    }

    const activeBusinessIds = (memberships ?? [])
      .filter((m) => !(m as any).deleted_at)
      .map((m) => String((m as { business_id?: string | null }).business_id ?? ""))
      .filter(Boolean);
    const hasAnyBusiness = activeBusinessIds.length > 0;

    // Sin negocio (ej. recién registrado con Google): solo permitir onboarding en /app/setup
    if (!hasAnyBusiness) {
      if (pathname === "/app/setup" || pathname.startsWith("/app/setup/")) {
        return response;
      }
      const url = request.nextUrl.clone();
      url.pathname = "/app/setup";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (hasAnyBusiness) {
      const activeBusinessId = request.cookies.get("active_business_id")?.value;
      const validActive = !!activeBusinessId && activeBusinessIds.includes(activeBusinessId);
      const nextActiveBusinessId = validActive ? activeBusinessId : activeBusinessIds[0];

      if (nextActiveBusinessId) {
        response.cookies.set("active_business_id", nextActiveBusinessId, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        });
      }

      if (pathname.startsWith("/app/setup")) {
        const url = request.nextUrl.clone();
        url.pathname = "/app";
        return NextResponse.redirect(url);
      }

      const allowBypass = pathname.startsWith("/app/admin") || pathname.startsWith("/app/setup");

      if (!allowBypass && nextActiveBusinessId) {
        const { data: mem, error: memOneErr } = await supabase
          .from("memberships")
          .select("role, permissions, deleted_at")
          .eq("business_id", nextActiveBusinessId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (memOneErr && process.env.NODE_ENV === "development") {
          console.warn("[middleware] membership_one", memOneErr.message);
        }

        if ((mem as any)?.deleted_at) {
          await supabase.auth.signOut();
          const url = request.nextUrl.clone();
          url.pathname = "/auth/login";
          url.searchParams.set("error", "Usuario desactivado. Contactá al dueño del comercio.");
          url.searchParams.set("redirect", pathname);
          return NextResponse.redirect(url);
        }

        const role = String((mem as any)?.role ?? "member");
        if (role !== "owner") {
          const p = ((mem as any)?.permissions ?? {}) as any;
          const can = (key: string) => Boolean(p?.[key]);
          const canPos = Boolean(p?.pos ?? p?.sales);

          // Si entra a /app (dashboard) y no tiene permiso, mandarlo a la primera sección permitida.
          if (pathname === "/app" && !can("dashboard")) {
            const firstAllowed =
              (canPos && "/app/pos") ||
              (can("inventory") && "/app/inventory") ||
              (can("cash") && "/app/cash") ||
              (can("products") && "/app/products") ||
              (can("reports") && "/app/reports") ||
              (can("settings") && "/app/settings") ||
              (can("subscription") && "/app/subscription") ||
              "/auth/login";

            const url = request.nextUrl.clone();
            url.pathname = firstAllowed;
            url.search = "";
            return NextResponse.redirect(url);
          }

          let required: string | null = null;
          if (pathname === "/app") required = "dashboard";
          else if (pathname.startsWith("/app/subscription")) required = "subscription";
          else if (pathname.startsWith("/app/pos")) required = "pos";
          else if (pathname.startsWith("/app/inventory")) required = "inventory";
          else if (pathname.startsWith("/app/sales")) required = "sales";
          else if (pathname.startsWith("/app/cash")) required = "cash";
          else if (pathname.startsWith("/app/products")) required = "products";
          else if (pathname.startsWith("/app/clientes")) required = "products";
          else if (pathname.startsWith("/app/proveedores")) required = "products";
          else if (pathname.startsWith("/app/empleados")) required = "products";
          else if (pathname.startsWith("/app/etiquetas")) required = "products";
          else if (pathname.startsWith("/app/reports")) required = "reports";
          else if (pathname.startsWith("/app/settings")) required = "settings";

          if (required === "pos") {
            if (!canPos) {
              const url = request.nextUrl.clone();
              url.pathname = "/app";
              url.searchParams.set("forbidden", "1");
              url.searchParams.set("section", required);
              return NextResponse.redirect(url);
            }
          } else if (required && !can(required)) {
            const url = request.nextUrl.clone();
            url.pathname = "/app";
            url.searchParams.set("forbidden", "1");
            url.searchParams.set("section", required);
            return NextResponse.redirect(url);
          }
        }
      }

      // /app/admin: la comprobación de admin es solo en servidor (page + actions). Así funciona aunque
      // Edge no inyecte PLATFORM_ADMIN_EMAILS; sin esto, cuentas admin con trial vencido no podían entrar.
      const allowWithoutSubscription = pathname.startsWith("/app/subscription") || pathname.startsWith("/app/admin");
      if (!allowWithoutSubscription && nextActiveBusinessId) {
        const { data: subRow, error: subErr } = await supabase
          .from("subscriptions")
          .select("status, current_period_start, current_period_end, plan_id")
          .eq("business_id", nextActiveBusinessId)
          .maybeSingle();

        if (subErr && process.env.NODE_ENV === "development") {
          console.warn("[middleware] subscriptions", subErr.message);
        }

        const sub = subRow as SubscriptionRow | null;
        if (!businessHasAppAccess(sub)) {
          const url = request.nextUrl.clone();
          url.pathname = "/app/subscription";
          url.search = "";
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
