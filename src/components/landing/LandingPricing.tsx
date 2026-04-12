"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type PlanConfig = {
  amount: number;
  currency: string;
  title: string;
  days: number;
};

type Props = {
  plans: {
    monthly: PlanConfig;
    semester: PlanConfig;
    annual: PlanConfig;
  };
};

const FEATURES = [
  "Punto de venta y caja",
  "Productos y stock ilimitados",
  "Informes de ventas y caja",
  "Actualizaciones constantes",
  "Soporte prioritario",
];

type Theme = {
  price: string;
  border: string;
  cardBg: string;
  pill: string;
  bullet: string;
  ring?: string;
};

const THEMES: Record<"monthly" | "semester" | "annual", Theme> = {
  monthly: {
    price: "text-teal-200",
    border: "border-teal-400/30",
    cardBg: "bg-teal-500/[0.08]",
    pill: "bg-teal-500/20 text-teal-100",
    bullet: "text-teal-400",
  },
  semester: {
    price: "text-violet-200",
    border: "border-violet-400/30",
    cardBg: "bg-violet-500/[0.08]",
    pill: "bg-violet-500/20 text-violet-100",
    bullet: "text-violet-400",
  },
  annual: {
    price: "text-amber-200",
    border: "border-amber-400/35",
    cardBg: "bg-amber-500/[0.09]",
    pill: "bg-amber-500/25 text-amber-100",
    bullet: "text-amber-400",
    ring: "ring-2 ring-amber-400/35",
  },
};

function formatMoney(n: number) {
  return n.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

export function LandingPricing({ plans }: Props) {
  const rows = [
    {
      key: "monthly" as const,
      serifTitle: "Plan mensual",
      months: 1,
      plan: plans.monthly,
      blurb: "Probá el sistema con flexibilidad total.",
      cycleLabel: "Cada mes",
      featured: false,
    },
  ];

  return (
    <section id="planes" className="scroll-mt-24 py-12 text-white md:py-20">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-10 text-center md:mb-14">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-white md:text-5xl">
            Precios
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-white/65 md:text-base">
            Valores informativos en {plans.monthly.currency}. El cobro y la suscripción se gestionan
            desde tu cuenta cuando decidas activar un plan.
          </p>
        </header>

        <div className="mx-auto grid w-full max-w-xl gap-6 md:gap-5 lg:gap-8">
          {rows.map(({ key, serifTitle, months, plan, blurb, cycleLabel, featured }) => {
            const theme = THEMES[key];
            const fullPrice = plans.monthly.amount * months;
            const discount =
              months > 1 && fullPrice > plan.amount
                ? Math.round(((fullPrice - plan.amount) / fullPrice) * 100)
                : 0;
            const perMonth = plan.amount / months;

            return (
              <article
                key={key}
                className={cn(
                  "relative flex flex-col overflow-hidden rounded-2xl border border-solid p-6 shadow-xl shadow-black/20 backdrop-blur-sm md:p-8",
                  theme.border,
                  theme.cardBg,
                  featured && theme.ring
                )}
              >
                {featured ? (
                  <div className="absolute right-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-lg shadow-amber-500/30">
                    Más elegido
                  </div>
                ) : null}

                <div className="text-center">
                  <h3 className="font-serif text-xl font-bold text-white md:text-2xl">
                    {serifTitle}
                  </h3>

                  <div className="mt-6 flex flex-wrap items-baseline justify-center gap-2">
                    <span
                      className={cn(
                        "text-4xl font-extrabold tracking-tight tabular-nums md:text-5xl",
                        theme.price
                      )}
                    >
                      $ {formatMoney(plan.amount)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        theme.pill
                      )}
                    >
                      {plan.currency}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-white/55 md:text-sm">Pesos argentinos</p>
                  <p className="text-xs font-medium text-white/70 md:text-sm">{cycleLabel}</p>

                  <p className="mx-auto mt-5 max-w-[260px] text-pretty text-sm leading-relaxed text-white/70">
                    {blurb}
                  </p>

                  {months > 1 ? (
                    <div className="mt-4 space-y-1 text-sm text-white/75">
                      <p>
                        <span className="text-white/35 line-through">
                          $ {formatMoney(fullPrice)}
                        </span>
                        {discount > 0 ? (
                          <span className="ml-2 font-semibold text-white">
                            Ahorrás {discount}%
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-white/55">
                        Equivale a ~$ {formatMoney(perMonth)} / mes en este período
                      </p>
                    </div>
                  ) : null}
                </div>

                <hr className="my-8 border-white/10" />

                <ul className="space-y-3 text-left text-sm text-white/80">
                  {FEATURES.map((f) => (
                    <li key={f} className="flex gap-3">
                      <Check
                        className={cn("mt-0.5 size-4 shrink-0 stroke-[2.5]", theme.bullet)}
                        aria-hidden
                      />
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>

                <p className="mt-6 text-center text-xs text-white/50">
                  Incluye {plan.days} días de acceso por período contratado.
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
