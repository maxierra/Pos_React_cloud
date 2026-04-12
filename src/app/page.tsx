import Link from "next/link";

import { LandingAbout } from "@/components/landing/LandingAbout";
import { LandingContact } from "@/components/landing/LandingContact";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingVideoTutorials } from "@/components/landing/LandingVideoTutorials";
import { LivePosDemo } from "@/components/landing/LivePosDemo";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAllPlansConfig } from "@/app/app/subscription/actions";

type Props = {
  searchParams?: Promise<{ missingSupabase?: string }>;
};

export default async function Home({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const plans = await getAllPlansConfig();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.28),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.24),transparent_36%),linear-gradient(135deg,#070b1a_0%,#0f172a_40%,#1e1b4b_100%)] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/35 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-4">
          <div className="flex flex-col gap-0 md:flex-row md:items-center md:justify-between md:gap-4 md:py-3">
            <div className="flex items-center justify-between gap-3 py-2.5 md:py-0">
              <div className="flex min-w-0 items-center gap-2">
                <div className="size-2 shrink-0 rounded-full bg-fuchsia-400 shadow-[0_0_18px_rgba(244,114,182,0.9)]" />
                <span className="truncate text-sm font-semibold tracking-tight text-white">POS SaaS</span>
              </div>
              <div className="flex shrink-0 items-center gap-2 md:hidden">
                <ThemeToggle />
                <Link
                  href="/auth/login"
                  className="animate-pulse-glow inline-flex h-8 items-center justify-center rounded-lg border-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-3 text-[0.75rem] font-bold text-white shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all active:scale-95"
                >
                  Ingresar
                </Link>
              </div>
            </div>

            <nav
              className="-mx-3 flex gap-x-4 gap-y-1 overflow-x-auto border-t border-white/10 px-3 py-2.5 text-[13px] [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-x-5 md:mx-0 md:flex-1 md:flex-wrap md:justify-center md:overflow-visible md:border-t-0 md:px-0 md:py-0 lg:justify-end [&::-webkit-scrollbar]:hidden"
              aria-label="Secciones"
            >
              <a href="#demo" className="shrink-0 font-medium text-white/70 transition hover:text-white">
                Demo
              </a>
              <a href="#features" className="shrink-0 font-medium text-white/70 transition hover:text-white">
                Funciones
              </a>
              <a href="#nosotros" className="shrink-0 font-medium text-white/70 transition hover:text-white">
                Nosotros
              </a>
              <a href="#tutoriales" className="shrink-0 font-medium text-white/70 transition hover:text-white">
                Tutoriales
              </a>
              <a href="#contacto" className="shrink-0 font-medium text-white/70 transition hover:text-white">
                Contacto
              </a>
              <a href="#planes" className="shrink-0 font-medium text-white/70 transition hover:text-white">
                Planes
              </a>
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              <ThemeToggle />
              <Link
                href="/auth/login"
                className="animate-pulse-glow inline-flex h-8 items-center justify-center rounded-lg border-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 text-[0.8rem] font-bold text-white transition-all hover:scale-110 active:scale-95 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
              >
                Ingresar
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-6 sm:px-4 sm:py-10">
        {sp.missingSupabase ? (
          <div className="mb-8 rounded-xl border border-amber-400/30 bg-amber-500/15 p-4 text-sm text-amber-100">
            Falta configurar Supabase. Podés ver la landing, pero <span className="text-white">/app</span> y autenticación no funcionarán hasta completar <code>.env.local</code>.
          </div>
        ) : null}

        <section className="mb-10 md:mb-14">
          <LandingHero />
        </section>

        <section id="demo" aria-labelledby="demo-heading" className="mb-2">
          <h2
            id="demo-heading"
            className="mb-4 text-center text-lg font-semibold tracking-tight text-white/90 md:text-xl"
          >
            Demo en vivo:{" "}
            <span className="bg-gradient-to-r from-fuchsia-200 via-violet-200 to-cyan-200 bg-clip-text text-transparent">
              productos → venta → dashboard
            </span>
          </h2>
          <LivePosDemo />
        </section>

        <section id="features">
          <LandingFeatures />
        </section>

        <LandingAbout />

        <LandingVideoTutorials />

        <LandingContact />

        <LandingPricing plans={plans} />

        <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center backdrop-blur-sm md:p-8">
          <p className="text-sm text-white/70 md:text-base">
            ¿Querés probarlo con tus datos? Creá tu cuenta en segundos.
          </p>
          <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
            <Link
              href="/auth/register"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:opacity-90"
            >
              Crear cuenta gratis
            </Link>
            <Link
              href="/auth/login"
              className="text-sm font-medium text-cyan-200/90 underline-offset-4 transition hover:text-cyan-100 hover:underline"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
