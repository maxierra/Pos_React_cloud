"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { createMicrosoftStoreSale, deleteMicrosoftStoreSale } from "@/app/admin/(dashboard)/descargas/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function SaveButton() { const { pending } = useFormStatus(); return <Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Registrar venta"}</Button>; }

function QuickSaleButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending} className="h-12 w-full text-base font-bold sm:w-auto">{pending ? "Registrando…" : "+ Registrar 1 venta de $50.000 hoy"}</Button>;
}

export function QuickStoreSaleForm({ today }: { today: string }) {
  return <form action={createMicrosoftStoreSale}>
    <input type="hidden" name="saleDate" value={today} />
    <input type="hidden" name="quantity" value="1" />
    <input type="hidden" name="unitAmount" value="50000" />
    <input type="hidden" name="note" value="Venta rápida" />
    <QuickSaleButton />
  </form>;
}

export function StoreSaleForm({ today }: { today: string }) {
  return <form action={createMicrosoftStoreSale} className="grid gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:grid-cols-2 lg:grid-cols-[160px_130px_180px_1fr_auto] lg:items-end">
    <label className="grid gap-1.5 text-xs font-semibold">Fecha<Input type="date" name="saleDate" defaultValue={today} required /></label>
    <label className="grid gap-1.5 text-xs font-semibold">Ventas<Input type="number" name="quantity" defaultValue="1" min="1" max="1000" required /></label>
    <label className="grid gap-1.5 text-xs font-semibold">Precio por venta ($)<Input type="number" name="unitAmount" defaultValue="50000" min="0" step="0.01" required /></label>
    <label className="grid gap-1.5 text-xs font-semibold">Nota opcional<Input name="note" maxLength={300} placeholder="Ej.: transferencia confirmada" /></label>
    <SaveButton />
  </form>;
}

export function DeleteStoreSaleButton({ id }: { id: string }) {
  return <form action={deleteMicrosoftStoreSale}><input type="hidden" name="id" value={id} /><Button type="submit" size="icon" variant="ghost" aria-label="Eliminar venta" onClick={(event) => { if (!window.confirm("¿Eliminar este registro de venta?")) event.preventDefault(); }}><Trash2 className="size-4 text-destructive" /></Button></form>;
}
