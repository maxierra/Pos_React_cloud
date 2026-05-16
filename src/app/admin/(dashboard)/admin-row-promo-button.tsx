"use client";

import * as React from "react";
import { Copy, Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { adminCreateSubscriptionPromo } from "@/app/admin/(dashboard)/admin-promo-actions";
import type { PlanKey } from "@/app/app/subscription/actions";
import { Button } from "@/components/ui/button";

type Props = {
  businessId: string;
  businessName: string;
};

const PLAN_OPTIONS: { value: PlanKey; label: string }[] = [
  { value: "monthly", label: "1m" },
  { value: "semester", label: "6m" },
  { value: "annual", label: "12m" },
];

export function AdminRowPromoButton({ businessId, businessName }: Props) {
  const [planKey, setPlanKey] = React.useState<PlanKey>("monthly");
  const [loading, setLoading] = React.useState(false);
  const [lastCode, setLastCode] = React.useState<string | null>(null);

  const onGenerate = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminCreateSubscriptionPromo({
        businessId,
        discountPercent: 50,
        planKey,
        expiresAtDate: null,
        note: `Tabla admin · ${businessName}`,
      });
      if ("error" in res) {
        if (res.error === "forbidden") {
          toast.error("Sesión de admin no detectada", {
            description: "Volvé a entrar en /admin/login. Revisá PLATFORM_ADMIN_EMAILS.",
          });
        } else if (res.error === "invalid_uuid") toast.error("ID de negocio inválido.");
        else if (res.error === "not_found") toast.error("Negocio no encontrado.");
        else toast.error(res.message ?? "No se pudo generar el código.");
        return;
      }
      setLastCode(res.code);
      void navigator.clipboard.writeText(res.code);
      toast.success("Código copiado al portapapeles", {
        description: res.code,
        duration: 15_000,
        className: "font-mono",
      });
    } finally {
      setLoading(false);
    }
  }, [businessId, businessName, planKey]);

  const copyAgain = React.useCallback(() => {
    if (!lastCode) return;
    void navigator.clipboard.writeText(lastCode);
    toast.success("Copiado", { description: lastCode, duration: 8000 });
  }, [lastCode]);

  return (
    <div className="flex shrink-0 flex-nowrap items-center gap-1">
      <select
        value={planKey}
        onChange={(e) => setPlanKey(e.target.value as PlanKey)}
        className="h-7 w-[52px] shrink-0 rounded border border-input bg-background px-1 text-[10px] font-medium"
        title="Plan del bono (meses)"
        aria-label="Plan del bono"
      >
        {PLAN_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="h-7 shrink-0 px-1.5"
        title="Generar código −50% (también se copia al portapapeles)"
        disabled={loading}
        onClick={() => void onGenerate()}
      >
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Gift className="size-3.5" />}
      </Button>
      {lastCode ? (
        <div className="flex shrink-0 flex-nowrap items-center gap-0.5 rounded-md border border-violet-300/80 bg-violet-500/10 py-0.5 pl-2 pr-0.5 dark:border-violet-600/60 dark:bg-violet-950/60">
          <code
            className="select-all whitespace-nowrap font-mono text-[11px] font-semibold tracking-wide text-violet-950 dark:text-violet-100"
            title={lastCode}
          >
            {lastCode}
          </code>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 shrink-0 px-2"
            onClick={copyAgain}
            title="Copiar de nuevo"
          >
            <Copy className="size-3.5" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
