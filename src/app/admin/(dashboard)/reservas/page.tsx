import { loadComboReservations } from "@/app/admin/(dashboard)/reservas/data";

function paymentMethodLabel(value: string) {
  switch (value) {
    case "mercadopago":
      return "Mercado Pago";
    case "transferencia":
      return "Transferencia";
    case "efectivo":
      return "Efectivo";
    case "a_coordinar":
      return "A coordinar";
    default:
      return value;
  }
}

function statusLabel(value: string) {
  switch (value) {
    case "pending":
      return "Pendiente";
    case "contacted":
      return "Contactado";
    case "closed":
      return "Cerrado";
    default:
      return value;
  }
}

export default async function AdminReservasPage() {
  const rows = await loadComboReservations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reservas de combos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acá ves quién dejó sus datos para coordinar pago y entrega del combo.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Combo</th>
              <th className="px-3 py-2">Dirección</th>
              <th className="px-3 py-2">Pago</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Notas</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-12 text-center text-muted-foreground">
                  Todavía no hay reservas de combos.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-border/50 align-top">
                  <td className="px-3 py-3 text-xs">
                    {new Date(row.created_at).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{row.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{row.phone}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div>{row.combo_title}</div>
                    <div className="text-xs text-muted-foreground">{row.combo_sku}</div>
                  </td>
                  <td className="px-3 py-3 text-xs">{row.shipping_address}</td>
                  <td className="px-3 py-3">{paymentMethodLabel(row.payment_method)}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{row.notes || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
