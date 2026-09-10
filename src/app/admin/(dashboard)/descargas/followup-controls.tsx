import { updateDownloadFollowup, updateDownloadLead } from "@/app/admin/(dashboard)/descargas/actions";

type Props = { id: string; name: string; phone: string | null; createdAt: string; contactedAt: string | null; paidAt: string | null; reminderAt: string | null; activationCode?: string | null };

export function FollowupControls({ id, name, phone, createdAt, contactedAt, paidAt, reminderAt, activationCode }: Props) {
  const digits = phone?.replace(/\D/g, "");
  if (!digits) return <span className="text-xs text-muted-foreground">Agregá un teléfono para contactar</span>;
  const age = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  const initial = `Hola ${name}, gracias por descargar Tienda360. ¿Pudiste instalarlo? Si necesitás ayuda para empezar, estoy acá para acompañarte.`;
  const reminder = `Hola ${name}, ¿cómo estás? Tu prueba gratuita de Tienda360 está por vencer. Podés conservar tus productos, ventas y configuraciones intactos activando la licencia definitiva por $35.000. Si querés, te ayudo a activarla.`;
  return <div className="flex flex-wrap gap-2">
    <a className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white" href={`https://wa.me/${digits}?text=${encodeURIComponent(initial)}`} target="_blank" rel="noreferrer">Saludar por WhatsApp</a>
    {!contactedAt ? <form action={updateDownloadFollowup}><input type="hidden" name="id" value={id} /><button className="rounded-lg border px-3 py-2 text-xs font-semibold" name="kind" value="contacted">Marcar contactado</button></form> : <span className="rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-700">Contactado</span>}
    {age >= 2 && !paidAt ? <><a className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-black" href={`https://wa.me/${digits}?text=${encodeURIComponent(reminder)}`} target="_blank" rel="noreferrer">Recordar día 2/3</a>{!reminderAt ? <form action={updateDownloadFollowup}><input type="hidden" name="id" value={id} /><button className="rounded-lg border px-3 py-2 text-xs font-semibold" name="kind" value="reminder">Marcar recordatorio</button></form> : null}</> : null}
    {!paidAt ? <form action={updateDownloadFollowup}><input type="hidden" name="id" value={id} /><button className="rounded-lg border border-sky-300 px-3 py-2 text-xs font-semibold text-sky-700" name="kind" value="paid">Marcar pago $35.000</button></form> : <span className="rounded-lg bg-sky-500/15 px-3 py-2 text-xs font-semibold text-sky-700">Cliente pago · $35.000</span>}
    <form action={updateDownloadLead} className="flex w-full flex-wrap items-center gap-2 rounded-lg bg-sky-500/5 p-2"><input type="hidden" name="id" value={id} /><input type="hidden" name="activationState" value="requested" /><input type="hidden" name="adminNote" value="" /><input type="hidden" name="markPaid" value="yes" /><input name="activationCode" defaultValue={activationCode ?? ""} maxLength={120} placeholder="Código de licencia" aria-label={`Código de licencia de ${name}`} className="h-9 min-w-52 flex-1 rounded-lg border bg-background px-3 text-xs" /><button className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white" type="submit">Guardar código y marcar pago</button></form>
  </div>;
}
