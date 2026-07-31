"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  Clock,
  Copy,
  Crown,
  Gem,
  Loader2,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { startMercadoPagoCheckout } from "@/app/app/subscription/actions";
import { Button } from "@/components/ui/button";
import { TrialCountdown } from "@/components/trial-countdown";
import { parseDbTimestamptzToDate } from "@/lib/parse-db-timestamp";
import { businessHasAppAccess, type SubscriptionRow } from "@/lib/subscription";
import { cn } from "@/lib/utils";

export type ManualContactProps = {
  mpAlias: string;
  phoneDisplay: string;
  whatsappDigits: string;
  cbu: string;
  transferHolder: string;
  transferNote: string;
};

type PlanKey = "monthly" | "semester" | "annual";

type PlanConfig = {
  amount: number;
  currency: string;
  title: string;
  days: number;
  planKey: PlanKey;
};

type Props = {
  businessId: string;
  subscription: SubscriptionRow | null;
  plans: {
    monthly: PlanConfig;
    semester: PlanConfig;
    annual: PlanConfig;
  };
  loadError?: string | null;
  mercadoPagoConfigured: boolean;
  manualContact: ManualContactProps;
};

const PLAN_FEATURES = ["Punto de venta y caja", "Productos y stock", "Ventas e informes", "Actualizaciones incluidas"];

const PLAN_UI: Record<
  PlanKey,
  {
    name: string;
    periodLabel: string;
    badge: string;
    accent: string;
    ring: string;
    surface: string;
    button: string;
    chip: string;
    Icon: typeof Clock;
  }
> = {
  monthly: {
    name: "Mensual",
    periodLabel: "Pago mes a mes",
    badge: "Flexible",
    accent: "text-sky-950 dark:text-sky-50",
    ring: "border-sky-300/70 dark:border-sky-700/70",
    surface:
      "from-white via-sky-50/80 to-cyan-50/70 dark:from-slate-950 dark:via-sky-950/40 dark:to-cyan-950/30",
    button: "bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400",
    chip: "bg-sky-100 text-sky-800 dark:bg-sky-900/70 dark:text-sky-100",
    Icon: Clock,
  },
  semester: {
    name: "6 meses",
    periodLabel: "Ahorra y paga menos por mes",
    badge: "Mas elegido",
    accent: "text-emerald-950 dark:text-emerald-50",
    ring: "border-emerald-300/80 dark:border-emerald-700/70",
    surface:
      "from-emerald-50 via-white to-teal-50 dark:from-emerald-950/45 dark:via-slate-950 dark:to-teal-950/35",
    button: "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400",
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-100",
    Icon: BadgeCheck,
  },
  annual: {
    name: "1 año",
    periodLabel: "El mejor valor del año",
    badge: "Mejor valor",
    accent: "text-amber-950 dark:text-amber-50",
    ring: "border-amber-300/80 dark:border-amber-700/70",
    surface:
      "from-amber-50 via-white to-orange-50 dark:from-amber-950/40 dark:via-slate-950 dark:to-orange-950/30",
    button: "bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-300 text-slate-950",
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-100",
    Icon: Crown,
  },
};

function moneyAr(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function SubscriptionClient({
  businessId,
  subscription,
  plans,
  loadError,
  mercadoPagoConfigured,
  manualContact,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = React.useState<PlanKey | null>(null);

  const { mpAlias, phoneDisplay, whatsappDigits, cbu, transferHolder, transferNote } = manualContact;
  const hasManualDetails = Boolean(
    mpAlias || phoneDisplay || whatsappDigits || cbu || transferHolder || transferNote
  );
  const hasAccess = businessHasAppAccess(subscription);
  const showAssistedBlock = !mercadoPagoConfigured || !hasAccess;

  const whatsappHref = React.useMemo(() => {
    if (!whatsappDigits) return null;
    const text = encodeURIComponent(
      `Hola, quiero activar mi suscripcion.\n\nID de mi negocio: ${businessId}\n\nAdjunto comprobante de transferencia (si aplica).`
    );
    return `https://wa.me/${whatsappDigits}?text=${text}`;
  }, [businessId, whatsappDigits]);

  const telHref = React.useMemo(() => {
    if (whatsappDigits) return `tel:+${whatsappDigits}`;
    const d = phoneDisplay.replace(/\D/g, "");
    if (!d) return null;
    if (d.startsWith("54")) return `tel:+${d}`;
    if (d.startsWith("9") && d.length >= 10) return `tel:+${d}`;
    return `tel:+54${d}`;
  }, [phoneDisplay, whatsappDigits]);

  const copyBusinessId = React.useCallback(() => {
    void navigator.clipboard.writeText(businessId);
    toast.success("ID de negocio copiado", {
      description: "Pegalo en WhatsApp o mensaje para el administrador.",
    });
  }, [businessId]);

  const copyMpAlias = React.useCallback(() => {
    if (!mpAlias) return;
    void navigator.clipboard.writeText(mpAlias);
    toast.success("Alias copiado");
  }, [mpAlias]);

  React.useEffect(() => {
    const mp = searchParams?.get("mp");
    if (mp === "success") {
      toast.success("Pago recibido", {
        description: "Si no se actualiza solo, espera unos segundos o actualiza la pagina.",
      });
      router.replace("/app/subscription");
    } else if (mp === "pending") {
      toast.message("Pago pendiente", { description: "Te avisaremos cuando se acredite." });
      router.replace("/app/subscription");
    } else if (mp === "failure") {
      toast.error("No se completo el pago");
      router.replace("/app/subscription");
    }
  }, [router, searchParams]);

  const isTrial = subscription?.status === "trialing";
  const isActive = subscription?.status === "active";
  const trialEnds = parseDbTimestamptzToDate(subscription?.current_period_end ?? null);
  const periodEnds =
    isActive && subscription?.current_period_end
      ? parseDbTimestamptzToDate(subscription.current_period_end)
      : null;

  const planCards = React.useMemo(() => {
    const monthlyBase = plans.monthly.amount;

    return ([plans.monthly, plans.semester, plans.annual] as const).map((plan) => {
      const months = Math.max(1, Math.round(plan.days / 30));
      const regularTotal = monthlyBase * months;
      const savings = Math.max(0, regularTotal - plan.amount);
      const discountPercent = regularTotal > 0 ? Math.round((savings / regularTotal) * 100) : 0;
      const monthlyEquivalent = plan.amount / months;

      return {
        ...plan,
        months,
        regularTotal,
        savings,
        discountPercent,
        monthlyEquivalent,
        ui: PLAN_UI[plan.planKey],
      };
    });
  }, [plans]);

  const onPayPlan = async (planKey: PlanKey) => {
    setLoadingPlan(planKey);
    try {
      const res = await startMercadoPagoCheckout(planKey);
      if ("error" in res) {
        toast.error("No se pudo iniciar el pago", { description: res.error });
        return;
      }
      window.location.href = res.checkoutUrl;
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section
        className={cn(
          "rounded-3xl border border-[var(--pos-border)] bg-[var(--pos-surface)] p-6 shadow-sm",
          "bg-gradient-to-br from-[var(--pos-surface)] via-[color-mix(in_oklab,var(--pos-accent)_4%,var(--pos-surface))] to-[color-mix(in_oklab,var(--sub-sky)_8%,var(--pos-surface))]"
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--pos-accent)_18%,transparent)] text-[var(--pos-accent)] shadow-[0_0_24px_var(--pos-glow)]">
            <Clock className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Estado de tu cuenta</h2>
            <p className="text-xs text-muted-foreground">Prueba gratuita y acceso al sistema</p>
          </div>
          {subscription && hasAccess && isTrial ? (
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <Sparkles className="size-3.5" />
              Prueba activa
            </span>
          ) : null}
          {subscription && isActive && hasAccess ? (
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-sky-500/35 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-800 dark:text-sky-200">
              <ShieldCheck className="size-3.5" />
              Plan activo
            </span>
          ) : null}
        </div>

        <div className="mt-6 space-y-5 text-sm">
          {loadError ? (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/[0.12] px-4 py-3 text-xs text-amber-900 dark:text-amber-100">
              <strong className="font-semibold">No se pudo cargar la suscripcion.</strong> {loadError}
            </div>
          ) : null}

          {!subscription ? (
            <p className="leading-relaxed text-muted-foreground">
              Este negocio no tiene registro de plan en la base. Al pagar se creara tu suscripcion y el periodo activo.
            </p>
          ) : hasAccess ? (
            <>
              {isTrial && trialEnds ? (
                <div className="space-y-5">
                  <p className="leading-relaxed text-foreground">
                    Disfruta la <strong className="text-[var(--pos-accent)]">prueba gratis</strong> hasta{" "}
                    <strong>
                      {trialEnds.toLocaleString("es-AR", {
                        timeZone: "America/Argentina/Buenos_Aires",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </strong>
                    .
                  </p>
                  <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      Tiempo restante
                    </p>
                    <TrialCountdown endsAt={subscription.current_period_end!} variant="large" />
                  </div>
                </div>
              ) : null}
              {isActive && periodEnds ? (
                <p className="leading-relaxed">
                  Tu plan esta <strong className="text-sky-600 dark:text-sky-300">activo</strong> hasta{" "}
                  <strong>
                    {periodEnds.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}
                  </strong>
                  .
                </p>
              ) : null}
            </>
          ) : (
            <div className="space-y-4">
              {isTrial && subscription?.current_period_end ? (
                <TrialCountdown endsAt={subscription.current_period_end} variant="large" />
              ) : null}
              <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-4">
                <p className="font-medium text-destructive">Tu prueba termino</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Para seguir usando el punto de venta, productos e informes, activa cualquiera de los planes
                  disponibles y el acceso se reactivara en forma automatica.
                </p>
              </div>
              <div className="flex gap-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.08] to-teal-500/[0.04] px-4 py-4 dark:from-emerald-400/10 dark:to-teal-500/5">
                <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  <BadgeCheck className="size-5" />
                </span>
                <div className="min-w-0 space-y-1.5 text-sm leading-relaxed text-foreground/90">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-200">Reactivacion automatica</p>
                  <p className="text-muted-foreground">
                    Cuando el pago con Mercado Pago se acredita, <strong className="text-foreground">tu acceso se activa solo</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="text-center sm:text-left">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Activa tu plan</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Elige la opcion que mejor se adapte a tu ritmo. Todos los planes incluyen las mismas funciones.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
            {planCards.map((plan) => {
              const isLoading = loadingPlan === plan.planKey;
              const Icon = plan.ui.Icon;

              return (
                <article
                  key={plan.planKey}
                  className={cn(
                    "relative overflow-hidden rounded-[28px] border bg-gradient-to-br p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] transition-transform duration-200",
                    plan.ui.ring,
                    plan.ui.surface,
                    plan.planKey === "semester" ? "lg:-translate-y-3 lg:scale-[1.02]" : ""
                  )}
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-70" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                          plan.ui.chip
                        )}
                      >
                        {plan.ui.badge}
                      </span>
                      <h4 className={cn("mt-2 text-2xl font-black tracking-tight", plan.ui.accent)}>{plan.ui.name}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{plan.periodLabel}</p>
                    </div>
                    <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-white/50 bg-white/65 text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-100">
                      <Icon className="size-5" />
                    </span>
                  </div>

                  <div className="mt-6">
                    <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                      <span className={cn("text-4xl font-black tabular-nums tracking-tight", plan.ui.accent)}>
                        {moneyAr(plan.amount)}
                      </span>
                      <span className="pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        total
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {plan.planKey === "monthly" ? (
                        <>Renovacion mensual</>
                      ) : (
                        <>
                          Equivale a <strong className="text-foreground">{moneyAr(plan.monthlyEquivalent)}</strong> por mes
                        </>
                      )}
                    </p>
                  </div>

                  {plan.planKey !== "monthly" ? (
                    <div className="mt-5 rounded-2xl border border-white/50 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Ahorras</p>
                      <p className="mt-1 text-lg font-bold text-foreground">
                        {moneyAr(plan.savings)} <span className="text-sm font-medium text-muted-foreground">({plan.discountPercent}% off)</span>
                      </p>
                    </div>
                  ) : null}

                  <ul className="mt-5 space-y-2 border-t border-white/50 pt-5 text-sm dark:border-white/10">
                    {PLAN_FEATURES.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-foreground/85">
                        <Gem className="size-3.5 text-[var(--pos-accent)]" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                      if (!mercadoPagoConfigured) {
                        document.getElementById("subscription-manual")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        return;
                      }
                      void onPayPlan(plan.planKey);
                    }}
                    className={cn(
                      "mt-6 h-11 w-full rounded-2xl text-sm font-semibold shadow-lg transition",
                      plan.ui.button,
                      plan.planKey === "annual" ? "shadow-amber-950/10" : "text-white"
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Procesando...
                      </>
                    ) : mercadoPagoConfigured ? (
                      `Elegir ${plan.ui.name}`
                    ) : (
                      "Ver opciones de pago"
                    )}
                  </Button>
                </article>
              );
            })}
        </div>
      </section>

      {showAssistedBlock ? (
        <section id="subscription-manual" className="scroll-mt-8 w-full">
          <div className="rounded-3xl border border-[var(--pos-border)] bg-[var(--pos-surface)] p-6 shadow-sm">
            <div className="flex flex-wrap items-start gap-3">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-700 dark:text-violet-300">
                <MessageCircle className="size-5" />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="text-lg font-semibold tracking-tight">Pago o activacion manual</h3>
                <p className="text-sm text-muted-foreground">
                  Si no tenes tarjeta, preferis transferir o pagar por Mercado Pago con alias, contactanos con el{" "}
                  <strong className="text-foreground">ID de tu negocio</strong>.
                </p>
              </div>
            </div>

            {!mercadoPagoConfigured ? (
              <div className="mt-4 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
                El cobro con tarjeta no esta activo en este servidor. Usa alias, WhatsApp o telefono.
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ID de tu negocio</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 break-all rounded-xl border border-[var(--pos-border)] bg-[var(--pos-surface-2)] px-3 py-2.5 text-xs">
                  {businessId}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 shrink-0 gap-2 rounded-xl"
                  onClick={copyBusinessId}
                >
                  <Copy className="size-4" />
                  Copiar ID
                </Button>
              </div>
            </div>

            {hasManualDetails ? (
              <div className="mt-6 space-y-4 border-t border-[var(--pos-border)] pt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {mpAlias ? (
                    <div className="rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface-2)]/80 p-4">
                      <p className="text-xs font-semibold text-muted-foreground">Mercado Pago / transferencia (alias)</p>
                      <p className="mt-1 font-mono text-sm font-medium">{mpAlias}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-8 gap-1.5 px-2 text-xs"
                        onClick={copyMpAlias}
                      >
                        <Copy className="size-3.5" />
                        Copiar alias
                      </Button>
                    </div>
                  ) : null}
                  {(phoneDisplay || telHref) ? (
                    <div className="rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface-2)]/80 p-4">
                      <p className="text-xs font-semibold text-muted-foreground">Telefono</p>
                      {phoneDisplay ? <p className="mt-1 text-sm font-medium">{phoneDisplay}</p> : null}
                      {telHref ? (
                        <a
                          href={telHref}
                          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--pos-accent)] underline-offset-4 hover:underline"
                        >
                          <Phone className="size-4" />
                          Llamar
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                {(cbu || transferHolder || transferNote) ? (
                  <div className="rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface-2)]/80 p-4">
                    <p className="text-xs font-semibold text-muted-foreground">Datos bancarios (transferencia)</p>
                    {transferHolder ? (
                      <p className="mt-2 text-sm">
                        <span className="text-muted-foreground">Titular: </span>
                        <span className="font-medium">{transferHolder}</span>
                      </p>
                    ) : null}
                    {cbu ? (
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <p className="min-w-0 flex-1 break-all font-mono text-sm">{cbu}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 shrink-0 gap-1.5"
                          onClick={() => {
                            void navigator.clipboard.writeText(cbu);
                            toast.success("CBU/CVU copiado");
                          }}
                        >
                          <Copy className="size-3.5" />
                          Copiar
                        </Button>
                      </div>
                    ) : null}
                    {transferNote ? <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{transferNote}</p> : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-6 border-t border-[var(--pos-border)] pt-6 text-sm text-muted-foreground">
                Pedile al administrador los datos de pago; solo necesitas enviarle el ID de arriba.
              </p>
            )}

            {whatsappHref ? (
              <div className="mt-6">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#20bd5a] sm:w-auto"
                >
                  <MessageCircle className="size-5" />
                  Escribir por WhatsApp (mensaje con tu ID)
                </a>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
