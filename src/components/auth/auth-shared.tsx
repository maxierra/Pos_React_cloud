import type { LucideIcon } from "lucide-react";
import { Store } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** Misma base visual que la landing (minimal + pasteles suaves) */
export const authPageBackgroundClass =
  "auth-dark-scene relative isolate min-h-screen flex flex-col overflow-hidden text-slate-900 bg-[#050d1d]";

export const authCommerceHeroImageUrl =
  "https://images.unsplash.com/photo-1441986300917-64667bdceb1?auto=format&fit=crop&w=1600&q=85";

export const authInputClassName =
  "h-11 border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400 shadow-sm focus-visible:border-sky-400 focus-visible:ring-sky-400/25";

export const authLabelClassName = "text-sm font-medium text-slate-700";

/** Iconos dentro del campo (Mail, Lock) — el padre ya tiene `relative` */
export const authInputIconClassName = "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400";

type MarketingFeature = { icon: LucideIcon; text: string };

type AuthMarketingPanelProps = {
  headline: string;
  description: string;
  features: MarketingFeature[];
  logoUrl?: string;
};

const featureTone = [
  { wrap: "border-cyan-300/25 bg-cyan-300/10 text-cyan-50", icon: "text-cyan-300" },
  { wrap: "border-emerald-300/25 bg-emerald-300/10 text-emerald-50", icon: "text-emerald-300" },
] as const;

export function AuthMarketingPanel({
  headline,
  description,
  features,
}: AuthMarketingPanelProps) {
  return (
    <section className="auth-dark-marketing relative hidden min-h-[560px] overflow-hidden rounded-3xl border border-cyan-300/20 bg-[radial-gradient(circle_at_12%_10%,rgba(34,211,238,.24),transparent_30%),radial-gradient(circle_at_92%_18%,rgba(139,92,246,.34),transparent_34%),linear-gradient(145deg,#071a3b,#0a2d60_48%,#251159)] shadow-[0_30px_80px_-32px_rgba(37,99,235,.9)] lg:block lg:min-h-[640px]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 top-16 h-56 w-56 rounded-full bg-violet-200/35 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-8 bottom-24 h-48 w-48 rounded-full bg-emerald-200/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-40 w-[80%] max-w-md -translate-x-1/2 rounded-full bg-sky-200/25 blur-3xl"
      />

      <div className="relative flex h-full flex-col p-10">
        <div className="flex items-center gap-3 text-white"><span className="flex size-11 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-300 shadow-[0_0_22px_rgba(34,211,238,.24)]"><Store className="size-6" /></span><div><div className="text-2xl font-black tracking-tight">Tienda<span className="text-cyan-300">360</span></div><div className="text-xs text-blue-100/70">POS SaaS</div></div></div>

        <div className="mt-10 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/90 bg-sky-50/90 px-3 py-1.5 text-xs font-semibold text-sky-950 shadow-sm backdrop-blur-sm">
            <Store className="size-3.5 text-sky-600" />
            Sistema de Gestión PRO
          </div>
          <div>
            <h2 className="text-balance text-3xl font-bold tracking-tight text-white md:text-4xl">{headline}</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100/80 md:text-base">{description}</p>
          </div>
          <ul className="grid gap-3 text-sm text-blue-50">
            {features.map(({ icon: Icon, text }, i) => {
              const tone = featureTone[i % featureTone.length];
              return (
                <li key={text} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl border shadow-sm backdrop-blur-sm",
                      tone.wrap,
                    )}
                  >
                    <Icon className={cn("size-4", tone.icon)} />
                  </span>
                  {text}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative mt-auto h-56">
          <div aria-hidden className="absolute inset-x-[8%] bottom-2 h-10 rounded-full bg-cyan-400/25 blur-2xl" />
          <img src="/tienda360-login-laptop.png" alt="Dashboard de Tienda360 en una laptop" className="relative mx-auto h-full w-full object-contain object-bottom drop-shadow-[0_20px_28px_rgba(2,12,50,.55)]" />
        </div>
      </div>
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
        "auth-glass-form mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-cyan-300/35 bg-[#07162d]/88 text-white shadow-[0_30px_90px_-28px_rgba(34,211,238,.65)] ring-1 ring-violet-400/20 backdrop-blur-xl",
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
    <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/90 bg-sky-50/90 px-3 py-1 text-xs font-semibold text-sky-950 shadow-sm">
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
    <div className="auth-glass-header border-b border-cyan-300/15 bg-[radial-gradient(circle_at_90%_0%,rgba(139,92,246,.22),transparent_40%),linear-gradient(145deg,rgba(15,37,70,.92),rgba(7,22,45,.88))] p-6 md:p-8">
      {eyebrow}
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-slate-600 md:text-base">{description}</p>
      {children}
    </div>
  );
}

export function AuthFormBody({ children }: { children: React.ReactNode }) {
  return <div className="auth-glass-body p-6 md:p-8 md:pt-6">{children}</div>;
}

export function AuthFormFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-glass-footer flex flex-col gap-3 border-t border-cyan-300/15 bg-blue-950/25 px-6 py-5 md:px-8">
      {children}
    </div>
  );
}

export function authAlertError(message: string) {
  return (
    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-900">{message}</div>
  );
}

export function authAlertSuccess(message: string) {
  return (
    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
      {message}
    </div>
  );
}

export function AuthPrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="mt-1 h-12 w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 text-sm font-bold text-white shadow-[0_12px_30px_-12px_rgba(34,211,238,.8)] transition hover:brightness-110 active:scale-[0.99]"
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
        "text-sm font-medium text-sky-800 underline-offset-4 transition hover:text-sky-950 hover:underline",
        className,
      )}
    >
      {children}
    </Link>
  );
}
