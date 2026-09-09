"use client";

import { Trash2 } from "lucide-react";

import { clearAllDownloadLeads, deleteDownloadLead } from "@/app/admin/(dashboard)/descargas/actions";
import { Button } from "@/components/ui/button";

export function DeleteDownloadLeadButton({ id }: { id: string; name: string }) {
  return <form action={deleteDownloadLead}><input type="hidden" name="id" value={id} /><Button type="submit" onClick={(event) => { if (!window.confirm("¿Eliminar esta descarga? Esta acción no se puede deshacer.")) event.preventDefault(); }} variant="destructive" aria-label="Eliminar descarga"><Trash2 className="size-4" />Eliminar</Button></form>;
}

export function ClearAllDownloadLeadsButton({ count }: { count: number }) {
  return <form action={clearAllDownloadLeads}><Button type="submit" onClick={(event) => { if (!window.confirm(`¿Eliminar las ${count} descargas registradas? Esta acción no se puede deshacer.`)) event.preventDefault(); }} variant="destructive" disabled={count === 0}><Trash2 className="size-4" />Limpiar descargas de prueba</Button></form>;
}
