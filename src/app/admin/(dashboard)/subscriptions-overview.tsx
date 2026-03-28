import { AdminQuickActivateButton } from "@/app/admin/(dashboard)/admin-quick-activate";
import { AdminQuickDeactivateButton } from "@/app/admin/(dashboard)/admin-quick-deactivate";
import type { AdminSubscriptionListItem } from "@/app/admin/(dashboard)/data";
import { parseDbTimestamptzToDate } from "@/lib/parse-db-timestamp";

function badgeForSummary(s: AdminSubscriptionListItem["billingSummary"]) {
  switch (s) {
    case "mp_automatico":
      return (
        <span className="inline-flex rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-800 dark:text-sky-200">
          MP / automático
        </span>
      );
    case "manual_admin":
      return (
        <span className="inline-flex rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-semibold text-violet-800 dark:text-violet-200">
          Manual (vos)
        </span>
      );
    case "solo_prueba":
      return (
        <span className="inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-900 dark:text-amber-100">
          Solo prueba
        </span>
      );
    case "suspendido_admin":
      return (
        <span className="inline-flex rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-semibold text-destructive">
          Suspendido (vos)
        </span>
      );
    default:
      return (
        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
          Sin pagos en lista
        </span>
      );
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    trialing: "En prueba",
    active: "Activo",
    past_due: "Pago vencido",
    canceled: "Cancelado",
  };
  return map[status] ?? status;
}

function providerLabel(provider: string) {
  if (provider === "admin_suspended") return "Suspendido (admin)";
  return provider;
}

type Props = {
  rows: AdminSubscriptionListItem[];
  billingDays: number;
};

export function AdminSubscriptionsOverview({ rows, billingDays }: Props) {
  const sinAcceso = rows.filter((r) => !r.hasAppAccess).length;
  const mpAuto = rows.filter((r) => r.billingSummary === "mp_automatico").length;
  const manual = rows.filter((r) => r.billingSummary === "manual_admin").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sin acceso al POS</p>
          <p className="mt-1 text-2xl font-bold text-destructive">{sinAcceso}</p>
          <p className="mt-1 text-xs text-muted-foreground">Trial vencido o plan inactivo — revisá transferencias</p>
        </div>
        <div className="rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cobro Mercado Pago</p>
          <p className="mt-1 text-2xl font-bold text-sky-600 dark:text-sky-300">{mpAuto}</p>
          <p className="mt-1 text-xs text-muted-foreground">Último pago aprobado vía MP o plan activo MP</p>
        </div>
        <div className="rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Activado manual</p>
          <p className="mt-1 text-2xl font-bold text-violet-600 dark:text-violet-300">{manual}</p>
          <p className="mt-1 text-xs text-muted-foreground">Transferencia / panel admin</p>
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--pos-border)] bg-[var(--pos-surface)] p-4 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Todas las suscripciones</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hasta 300 negocios por última actualización. <strong>+{billingDays} días</strong> habilita;{" "}
          <strong>Desactivar</strong> corta el acceso al POS. El campo <strong>Cobro</strong> indica MP automático vs
          manual.
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--pos-border)]">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--pos-border)] bg-[var(--pos-surface-2)]/80 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-3">Negocio</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3">Cobro</th>
                <th className="px-3 py-3">Provider (DB)</th>
                <th className="px-3 py-3">POS</th>
                <th className="px-3 py-3">Fin período</th>
                <th className="px-3 py-3">Último pago</th>
                <th className="px-3 py-3 min-w-[140px]">Acción</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.subscriptionId}
                  className="border-b border-[var(--pos-border)]/80 hover:bg-[var(--pos-surface-2)]/40"
                >
                  <td className="px-3 py-2.5 align-top">
                    <div className="font-medium">{r.businessName}</div>
                    <div className="text-xs text-muted-foreground">{r.businessSlug}</div>
                    <div className="mt-1 font-mono text-[10px] text-muted-foreground break-all">{r.businessId}</div>
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <span className="font-medium">{statusLabel(r.status)}</span>
                  </td>
                  <td className="px-3 py-2.5 align-top">{badgeForSummary(r.billingSummary)}</td>
                  <td className="px-3 py-2.5 align-top font-mono text-xs">{providerLabel(r.provider)}</td>
                  <td className="px-3 py-2.5 align-top">
                    {r.hasAppAccess ? (
                      <span className="text-emerald-600 dark:text-emerald-400">OK</span>
                    ) : (
                      <div>
                        <span className="font-medium text-destructive">Bloqueado</span>
                        {r.status === "trialing" &&
                        r.currentPeriodEndMs != null &&
                        r.currentPeriodEndMs < Date.now() ? (
                          <span className="mt-1 block max-w-[140px] text-[10px] leading-snug text-muted-foreground">
                            La prueba ya pasó su fecha fin (misma regla que el POS). Pulsá{" "}
                            <strong className="text-foreground">+{billingDays} días</strong>.
                          </span>
                        ) : null}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-top text-xs whitespace-nowrap">
                    {r.currentPeriodEnd
                      ? (() => {
                          const d = parseDbTimestamptzToDate(r.currentPeriodEnd);
                          return d
                            ? d.toLocaleString("es-AR", {
                                timeZone: "America/Argentina/Buenos_Aires",
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : r.currentPeriodEnd;
                        })()
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 align-top text-xs">
                    {r.lastPayment ? (
                      <div>
                        <div className="font-mono">{r.lastPayment.provider}</div>
                        <div className="text-muted-foreground">
                          {r.lastPayment.amount} {r.lastPayment.currency} · {r.lastPayment.status}
                        </div>
                        <div className="text-muted-foreground">
                          {new Date(r.lastPayment.created_at).toLocaleString("es-AR", {
                            timeZone: "America/Argentina/Buenos_Aires",
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </div>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <div className="flex flex-col gap-2">
                      <AdminQuickActivateButton businessId={r.businessId} billingDays={billingDays} />
                      <AdminQuickDeactivateButton businessId={r.businessId} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
