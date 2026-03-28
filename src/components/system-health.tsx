import { getSystemHealth } from "@/app/admin/(dashboard)/monitoring/health-data";
import { CheckCircle2, XCircle, AlertCircle, Database, KeyRound, Webhook } from "lucide-react";

export async function SystemHealth() {
  const health = await getSystemHealth();

  const isDbOk = health.dbConnection === "up";
  const isTokenOk = health.mpToken === "configured";
  const isWebhookOk = health.daysSinceLastPayment !== null && health.daysSinceLastPayment < 7; // Less than 7 days since last payment is OK

  return (
    <div className="rounded-2xl border dark:border-amber-900/30 bg-card dark:bg-[#120a00]/80 p-6 shadow-sm mb-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 dark:text-amber-50">
          <ActivityHeartbeatIcon className="h-5 w-5 text-orange-500" />
          Salud del Sistema
        </h2>
        <p className="text-sm text-muted-foreground dark:text-amber-200/50">
          Estado en tiempo real de integraciones críticas y conectividad.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Database Status */}
        <div className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${isDbOk ? "border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-950/20" : "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20"}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background dark:bg-black/40">
            <Database className={`h-5 w-5 ${isDbOk ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold dark:text-amber-100">Base de Datos</p>
            <p className={`text-xs ${isDbOk ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
              {isDbOk ? "Conectada (Supabase OK)" : "Falla de Conexión"}
            </p>
          </div>
          {isDbOk ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
        </div>

        {/* MercadoPago Token */}
        <div className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${isTokenOk ? "border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-950/20" : "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20"}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background dark:bg-black/40">
            <KeyRound className={`h-5 w-5 ${isTokenOk ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold dark:text-amber-100">Token MP</p>
            <p className={`text-xs ${isTokenOk ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
              {isTokenOk ? "Configurado (.env)" : "Falta MERCADOPAGO_ACCESS_TOKEN"}
            </p>
          </div>
          {isTokenOk ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
        </div>

        {/* Webhooks Flow */}
        <div className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${
          health.daysSinceLastPayment === null ? "border-orange-200 bg-orange-50 dark:border-orange-900/40 dark:bg-orange-950/20" 
          : isWebhookOk ? "border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-950/20" 
          : "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20"
        }`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background dark:bg-black/40">
            <Webhook className={`h-5 w-5 ${
              health.daysSinceLastPayment === null ? "text-orange-500 dark:text-orange-400" 
              : isWebhookOk ? "text-green-600 dark:text-green-400" 
              : "text-red-600 dark:text-red-400"
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold dark:text-amber-100">Flujo de Pagos</p>
            <p className={`text-xs ${
              health.daysSinceLastPayment === null ? "text-orange-700 dark:text-orange-300" 
              : isWebhookOk ? "text-green-700 dark:text-green-300" 
              : "text-red-700 dark:text-red-300"
            }`}>
              {health.daysSinceLastPayment === null 
                ? "Aún no hay pagos" 
                : `Último webhook hace ${health.daysSinceLastPayment} día(s)`}
            </p>
          </div>
          {health.daysSinceLastPayment === null ? <AlertCircle className="h-5 w-5 text-orange-500" /> 
           : isWebhookOk ? <CheckCircle2 className="h-5 w-5 text-green-500" /> 
           : <XCircle className="h-5 w-5 text-red-500" />}
        </div>
      </div>
    </div>
  );
}

function ActivityHeartbeatIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
