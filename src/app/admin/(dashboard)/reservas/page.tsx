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
  const pending = rows.filter((row) => row.status === "pending").length;
  const contacted = rows.filter((row) => row.status === "contacted").length;
  const closed = rows.filter((row) => row.status === "closed").length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">CABA y AMBA</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Pedidos para instalar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Clientes que dejaron sus datos para coordinar entrega, instalación y capacitación gratis.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[{ label: "Por contactar", value: pending, style: "border-amber-300 bg-amber-50 text-amber-950" }, { label: "Contactados", value: contacted, style: "border-sky-300 bg-sky-50 text-sky-950" }, { label: "Finalizados", value: closed, style: "border-emerald-300 bg-emerald-50 text-emerald-950" }].map((item) => (
          <div key={item.label} className={`rounded-xl border p-4 ${item.style}`}><p className="text-xs font-semibold uppercase tracking-wide opacity-70">{item.label}</p><p className="mt-1 text-3xl font-black">{item.value}</p></div>
        ))}
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
                  Todavía no hay pedidos de instalación en CABA o AMBA.
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
