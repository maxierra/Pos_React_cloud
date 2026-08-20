import { EnviosClient } from "@/app/admin/(dashboard)/envios/envios-client";
import { loadStoreShipments } from "@/app/admin/(dashboard)/envios/data";

export default async function AdminEnviosPage() {
  const rows = await loadStoreShipments("all");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">Interior del país</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Pedidos para enviar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ves el número de pedido desde que se inicia el pago. Despachá solamente los que figuran como pagados.
        </p>
      </div>
      <EnviosClient rows={rows} />
    </div>
  );
}
