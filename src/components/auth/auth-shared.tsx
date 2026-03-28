import type { LucideIcon } from "lucide-react";
import { Store } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** Misma base visual que la landing principal */
export const authPageBackgroundClass =
  "min-h-screen flex flex-col text-white bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.28),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.24),transparent_36%),linear-gradient(135deg,#070b1a_0%,#0f172a_40%,#1e1b4b_100%)]";

/** Interior de comercio retail (Unsplash) — reemplazá por tu propia foto si querés */
export const authCommerceHeroImageUrl =
  "https://images.unsplash.com/photo-1441986300917-64667bdceb1?auto=format&fit=crop&w=1600&q=85";

export const authInputClassName =
  "h-11 border-white/15 bg-white/5 pl-10 text-white placeholder:text-white/45 focus-visible:border-cyan-400/45 focus-visible:ring-cyan-400/25";

export const authLabelClassName = "text-sm font-medium text-white/85";

type MarketingFeature = { icon: LucideIcon; text: string };

type AuthMarketingPanelProps = {
  headline: string;
  description: string;
  features: MarketingFeature[];
  logoUrl?: string;
};

export function AuthMarketingPanel({
  headline,
  description,
  features,
  logoUrl = "/newlogo.jpeg",
}: AuthMarketingPanelProps) {
  return (
    <section className="relative hidden min-h-[560px] overflow-hidden rounded-3xl border border-white/10 bg-[#070b1a] shadow-[0_0_60px_-20px_rgba(34,211,238,0.25)] lg:block lg:min-h-[640px]">
      {/* Fondo con sutil gradiente */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.08),transparent_70%)]" />
      
      <div className="relative flex h-full flex-col p-10">
        {/* Logo destacado */}
        <div className="flex flex-1 items-center justify-center">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 blur-2xl opacity-50 group-hover:opacity-80 transition-opacity" />
            <img
              src={logoUrl}
              alt="Logo"
              className="relative h-64 w-auto object-contain rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </div>

        {/* Textos y Features al pie */}
        <div className="mt-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-cyan-200 backdrop-blur-md">
            <Store className="size-3.5 text-cyan-400" />
            Sistema de Gestión PRO
          </div>
          <div>
            <h2 className="text-balance text-3xl font-bold tracking-tight text-white md:text-4xl">{headline}</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60 md:text-base">{description}</p>
          </div>
          <ul className="grid gap-3 text-sm text-white/70">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] backdrop-blur-sm">
                  <Icon className="size-4 text-cyan-400" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Orbes decorativos */}
      <div className="pointer-events-none absolute -right-16 top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-32 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-3xl" />
    </section>
  );
}

type AuthFormSurfaceProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthFormSurface({ children, className }: AuthFormSurfaceProps) {
  return (
    <section
      className={cn(
        "mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-[0_0_50px_-12px_rgba(34,211,238,0.2)] backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </section>
  );
}

type AuthEyebrowProps = { children: React.ReactNode };

export function AuthEyebrow({ children }: AuthEyebrowProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-cyan-100 backdrop-blur-sm">
      {children}
    </div>
  );
}

export function AuthFormHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-white/10 p-6 md:p-8">
      {eyebrow}
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-white/65 md:text-base">{description}</p>
      {children}
    </div>
  );
}

export function AuthFormBody({ children }: { children: React.ReactNode }) {
  return <div className="p-6 md:p-8 md:pt-6">{children}</div>;
}

export function AuthFormFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t border-white/10 bg-white/[0.02] px-6 py-5 md:px-8">{children}</div>
  );
}

export function authAlertError(message: string) {
  return (
    <div className="mt-4 rounded-xl border border-red-400/35 bg-red-500/10 px-3 py-2.5 text-sm text-red-100">
      {message}
    </div>
  );
}

export function authAlertSuccess(message: string) {
  return (
    <div className="mt-4 rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-100">
      {message}
    </div>
  );
}

export function AuthPrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="mt-1 h-12 w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 text-sm font-bold text-white shadow-[0_0_36px_-8px_rgba(217,70,239,0.55)] transition hover:scale-[1.01] hover:shadow-[0_0_44px_-6px_rgba(34,211,238,0.45)] active:scale-[0.99]"
    >
      {children}
    </button>
  );
}

export function AuthTextLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium text-cyan-200/90 underline-offset-4 transition hover:text-cyan-100 hover:underline",
        className,
      )}
    >
      {children}
    </Link>
  );
}
