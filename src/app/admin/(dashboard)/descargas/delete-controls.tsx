"use client";

import { Trash2 } from "lucide-react";

import { clearAllDownloadLeads, deleteDownloadLead } from "@/app/admin/(dashboard)/descargas/actions";
import { Button } from "@/components/ui/button";

export function DeleteDownloadLeadButton({ id, name }: { id: string; name: string }) {
  return <form action={deleteDownloadLead} onSubmit={(event) => { if (!window.confirm(`¿Eliminar la descarga de ${name}? Esta acción no se puede deshacer.`)) event.preventDefault(); }}><input type="hidden" name="id" value={id} /><Button type="submit" variant="destructive" aria-label={`Eliminar descarga de ${name}`}><Trash2 className="size-4" />Eliminar</Button></form>;
}

export function ClearAllDownloadLeadsButton({ count }: { count: number }) {
  return <form action={clearAllDownloadLeads} onSubmit={(event) => { if (!window.confirm(`¿Eliminar las ${count} descargas registradas? Solo se borrarán eventos del instalador. Esta acción no se puede deshacer.`)) event.preventDefault(); }}><Button type="submit" variant="destructive" disabled={count === 0}><Trash2 className="size-4" />Limpiar descargas de prueba</Button></form>;
}
