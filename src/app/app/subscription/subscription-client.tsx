"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  Cloud,
  Clock,
  Copy,
  Crown,
  Headphones,
  HelpCircle,
  LockKeyhole,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Zap,
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
    name: "Plan Mensual",
    periodLabel: "Pago mes a mes, sin compromiso",
    badge: "Flexible",
    accent: "text-sky-950 dark:text-sky-50",
    ring: "border-sky-300/70 dark:border-sky-700/70",
    surface:
      "from-white via-sky-50/80 to-cyan-50/70 dark:from-slate-950 dark:via-sky-950/40 dark:to-cyan-950/30",
    button: "bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:text-white dark:hover:bg-sky-400",
    chip: "bg-sky-100 text-sky-800 dark:bg-sky-900/70 dark:text-sky-100",
    Icon: Clock,
  },
  semester: {
    name: "Plan Semestral",
    periodLabel: "Ahorra y paga menos por mes",
    badge: "Más elegido",
    accent: "text-white",
    ring: "border-cyan-300/80 dark:border-cyan-300/70",
    surface:
      "from-[#087fe8] via-[#075dcc] to-[#123b78] dark:from-[#087fe8] dark:via-[#075dcc] dark:to-[#123b78]",
    button: "bg-white text-blue-700 hover:bg-blue-50 dark:bg-white dark:text-blue-700 dark:hover:bg-blue-50",
    chip: "bg-white/90 text-emerald-700",
    Icon: BadgeCheck,
  },
  annual: {
    name: "Plan Anual",
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
    <div className="flex flex-col gap-7">
      <section
        className={cn(
          "rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_-32px_rgba(30,64,175,.55)] backdrop-blur-xl dark:border-blue-300/20 dark:bg-[#101a2e]/90",
          "bg-gradient-to-br from-[var(--pos-surface)] via-[color-mix(in_oklab,var(--pos-accent)_4%,var(--pos-surface))] to-[color-mix(in_oklab,var(--sub-sky)_8%,var(--pos-surface))]"
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--pos-accent)_18%,transparent)] text-[var(--pos-accent)] shadow-[0_0_24px_var(--pos-glow)]">
            <Clock className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">Estado de tu cuenta</h2>
            <p className="text-xs text-muted-foreground">Tu plan, acceso y vencimiento en un solo lugar</p>
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

        <div className="mt-3 space-y-3 text-sm">
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
                <div className="space-y-2 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:space-y-0">
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
                  <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-blue-500/35 bg-blue-500/5 px-4 py-2 text-xs font-bold text-blue-700 dark:text-blue-200"><Clock className="size-4" /> Plan de prueba</span>
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
          <h3 className="text-2xl font-black tracking-tight text-foreground">Elegí tu plan</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Elige la opcion que mejor se adapte a tu ritmo. Todos los planes incluyen las mismas funciones.
          </p>
        </div>

        <div className="grid gap-5 pt-2 lg:grid-cols-3">
            {planCards.map((plan) => {
              const isLoading = loadingPlan === plan.planKey;
              const Icon = plan.ui.Icon;

              return (
                <article
                  key={plan.planKey}
                  className={cn(
                    "relative flex min-h-[445px] flex-col overflow-hidden rounded-[28px] border bg-gradient-to-br p-6 shadow-[0_22px_65px_-32px_rgba(15,23,42,0.42)] transition-transform duration-200",
                    plan.ui.ring,
                    plan.ui.surface,
                    plan.planKey === "semester" ? "lg:-translate-y-3 lg:scale-[1.02]" : ""
                  )}
                >
                  {plan.planKey !== "monthly" ? (
                    <div className={cn("absolute right-0 top-0 flex h-20 w-28 flex-col items-center justify-center rounded-bl-[60px] text-center", plan.planKey === "semester" ? "bg-emerald-400 text-white" : "bg-emerald-100 text-emerald-800")}>
                      <span className="text-[10px] font-bold uppercase">Ahorrás</span>
                      <strong className="text-2xl leading-none">{plan.discountPercent}%</strong>
                    </div>
                  ) : null}
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-70" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {plan.planKey === "semester" ? <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]", plan.ui.chip)}>{plan.ui.badge}</span> : null}
                      <span className={cn("mt-4 flex size-10 items-center justify-center rounded-xl", plan.planKey === "semester" ? "bg-cyan-300/15 text-cyan-200" : plan.planKey === "annual" ? "bg-amber-100 text-amber-500" : "bg-blue-100 text-blue-600")}><Icon className="size-5" /></span>
                      <h4 className={cn("mt-3 text-2xl font-black tracking-tight", plan.ui.accent)}>{plan.ui.name}</h4>
                      <p className={cn("mt-1 text-sm", plan.planKey === "semester" ? "text-blue-100" : "text-muted-foreground")}>{plan.ui.periodLabel}</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                      <span className={cn("text-4xl font-black tabular-nums tracking-tight", plan.ui.accent)}>
                        {moneyAr(plan.amount)}
                      </span>
                      <span className={cn("pb-1 text-sm font-semibold", plan.planKey === "semester" ? "text-blue-100" : "text-muted-foreground")}>
                        / {plan.planKey === "monthly" ? "mes" : plan.planKey === "semester" ? "6 meses" : "año"}
                      </span>
                    </div>
                    {plan.planKey === "monthly" ? <p className="mt-2 text-sm text-muted-foreground">Renovación mensual</p> : null}
                  </div>

                  {plan.planKey !== "monthly" ? <div className={cn("mt-4 rounded-xl px-3 py-2 text-sm font-bold", plan.planKey === "semester" ? "bg-cyan-300/20 text-white" : "bg-emerald-100 text-emerald-900")}>Equivale a {moneyAr(plan.monthlyEquivalent)} por mes</div> : null}

                  <ul className="mt-5 space-y-2 border-t border-white/50 pt-5 text-sm dark:border-white/10">
                    {PLAN_FEATURES.map((f) => (
                      <li key={f} className={cn("flex items-center gap-2", plan.planKey === "semester" ? "text-white" : "text-foreground/85")}>
                        <Check className={cn("size-4", plan.planKey === "semester" ? "text-[#39ff14]" : "text-emerald-600")} strokeWidth={3} />
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
                      "mt-auto h-11 w-full rounded-2xl text-sm font-semibold shadow-lg transition",
                      plan.ui.button,
                      plan.planKey === "annual" && "shadow-amber-950/10"
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

      <section className="grid overflow-hidden rounded-3xl border border-blue-200/70 bg-white/80 shadow-[0_18px_50px_-34px_rgba(30,64,175,.45)] backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4 dark:border-blue-300/20 dark:bg-[#101a2e]/90">
        {[
          [Zap, "Activación inmediata", "Comenzá a usarlo en minutos"],
          [Cloud, "Actualizaciones incluidas", "Siempre con las últimas mejoras"],
          [Headphones, "Soporte técnico", "Te acompañamos cuando lo necesitás"],
          [LockKeyhole, "Tus datos seguros", "Protección y respaldo en la nube"],
        ].map(([Icon, title, description], index) => {
          const BenefitIcon = Icon as typeof Zap;
          return (
            <div key={String(title)} className={cn("flex items-center gap-3 px-5 py-5", index > 0 && "border-t border-blue-100 sm:border-l sm:border-t-0 dark:border-blue-300/15", index === 2 && "sm:border-l-0 lg:border-l")}>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/35 bg-cyan-100 text-blue-600 shadow-sm dark:bg-cyan-300/10 dark:text-cyan-300"><BenefitIcon className="size-5" /></span>
              <div><p className="text-sm font-extrabold text-foreground">{String(title)}</p><p className="mt-0.5 text-xs text-muted-foreground">{String(description)}</p></div>
            </div>
          );
        })}
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

      <section className="overflow-hidden rounded-3xl border border-blue-200/70 bg-white/80 shadow-sm backdrop-blur-xl dark:border-blue-300/20 dark:bg-[#101a2e]/90">
        <div className="flex items-center gap-3 border-b border-blue-100 px-6 py-5 dark:border-blue-300/15">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300"><HelpCircle className="size-5" /></span>
          <div><h3 className="text-lg font-black">Preguntas frecuentes</h3><p className="text-xs text-muted-foreground">Todo lo importante antes de elegir tu plan.</p></div>
        </div>
        <div className="divide-y divide-blue-100 px-6 dark:divide-blue-300/15">
          {[
            ["¿Todos los planes incluyen las mismas funciones?", "Sí. Punto de venta, caja, productos, stock, ventas, informes y actualizaciones están incluidos en todos los planes."],
            ["¿Cuándo se activa mi suscripción?", "La activación es automática cuando Mercado Pago acredita el pago. Si pagás por transferencia, soporte confirma la activación."],
            ["¿Pierdo mis datos si vence la prueba?", "No. Tus productos, ventas y configuraciones permanecen guardados para que continúes al activar un plan."],
          ].map(([question, answer]) => (
            <details key={question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-foreground"><span>{question}</span><ChevronDown className="size-4 shrink-0 text-blue-500 transition-transform group-open:rotate-180" /></summary>
              <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-cyan-300/25 bg-white/80 p-5 shadow-[0_18px_50px_-34px_rgba(30,64,175,.45)] backdrop-blur-xl sm:p-6 dark:bg-[#101a2e]/90">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black">¿Necesitás ayuda con tu suscripción?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Contactá al equipo de Tienda360 por el canal que prefieras.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 px-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-300/25 dark:text-blue-200 dark:hover:bg-blue-400/10" href="mailto:soporte@tienda360.site">
              <Mail className="size-4" />soporte@tienda360.site
            </a>
            <a className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#25D366] px-3 text-sm font-bold text-white transition hover:bg-[#20bd5a]" href="https://wa.me/5491123145742" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" />WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
