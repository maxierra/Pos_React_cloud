import { ArrowLeft, CreditCard, Search } from "lucide-react";
import Link from "next/link";
import { getPlatformPayments } from "./data";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function formatCurrency(amount: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminPaymentsPage() {
  const payments = await getPlatformPayments(100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 dark:text-amber-50">
              <CreditCard className="h-6 w-6 text-orange-500" />
              Historial de Pagos
            </h1>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground ml-10 dark:text-amber-200/50">
            Registro global de pagos procesados mediante webhook (Mercado Pago).
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm dark:bg-[#120a00]/80 dark:border-amber-900/30">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground dark:text-amber-200/60">
          <Search className="h-4 w-4" />
          <span>Mostrando los últimos {payments.length} pagos recibidos</span>
        </div>

        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center dark:border-amber-900/30">
            <CreditCard className="h-8 w-8 text-muted-foreground dark:text-amber-500/30 mb-4" />
            <h3 className="text-lg font-medium dark:text-amber-100">Sin pagos registrados</h3>
            <p className="text-sm text-muted-foreground dark:text-amber-200/50">
              Aún no ingresaron pagos por webhooks de Mercado Pago.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-amber-900/30">
                  <th className="text-left py-3 px-4 dark:text-amber-200/70 font-medium">Fecha</th>
                  <th className="text-left py-3 px-4 dark:text-amber-200/70 font-medium">Negocio</th>
                  <th className="text-left py-3 px-4 dark:text-amber-200/70 font-medium">ID Pago (MP)</th>
                  <th className="text-left py-3 px-4 dark:text-amber-200/70 font-medium">Moneda</th>
                  <th className="text-right py-3 px-4 dark:text-amber-200/70 font-medium">Total Pagado</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b dark:border-amber-900/10 hover:bg-muted/50 dark:hover:bg-amber-950/30 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-muted-foreground dark:text-amber-200/70">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="py-3 px-4 font-medium dark:text-amber-100">
                      {p.business_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs dark:text-amber-500/80">
                      {p.provider_payment_id || "N/A"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-amber-900/40 dark:text-amber-400 border border-transparent dark:border-amber-700/50">
                        {p.currency}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-green-600 dark:text-emerald-400">
                      + {formatCurrency(p.amount, p.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
