"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Truck } from "lucide-react";

import { deleteSupplier, saveSupplier } from "@/app/app/(main)/proveedores/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type SupplierRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_id: string | null;
  notes: string | null;
  created_at: string;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function ProveedoresClient({
  suppliers,
  orderCounts,
}: {
  suppliers: SupplierRow[];
  orderCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SupplierRow | null>(null);
  const [pending, startTransition] = React.useTransition();

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [taxId, setTaxId] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const reset = React.useCallback(() => {
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setTaxId("");
    setNotes("");
    setEditing(null);
  }, []);

  const openNew = React.useCallback(() => {
    reset();
    setOpen(true);
  }, [reset]);

  const openEdit = React.useCallback((s: SupplierRow) => {
    setEditing(s);
    setName(s.name);
    setPhone(s.phone ?? "");
    setEmail(s.email ?? "");
    setAddress(s.address ?? "");
    setTaxId(s.tax_id ?? "");
    setNotes(s.notes ?? "");
    setOpen(true);
  }, []);

  const onSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      startTransition(() => {
        void (async () => {
          try {
            await saveSupplier({
              id: editing?.id,
              name,
              phone: phone || null,
              email: email || null,
              address: address || null,
              tax_id: taxId || null,
              notes: notes || null,
            });
            toast.success(editing ? "Proveedor actualizado" : "Proveedor creado");
            setOpen(false);
            reset();
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
          }
        })();
      });
    },
    [address, editing?.id, email, name, notes, phone, reset, router, taxId]
  );

  const onDelete = React.useCallback(
    (s: SupplierRow) => {
      if (!confirm(`¿Eliminar a ${s.name}?`)) return;
      startTransition(() => {
        void (async () => {
          try {
            await deleteSupplier(s.id);
            toast.success("Proveedor eliminado");
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
          }
        })();
      });
    },
    [router]
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Proveedores</h1>
          <p className="text-sm text-muted-foreground">
            Cargá proveedores, hacé pedidos y seguí cuándo llega la mercadería y si pagaste la factura.
          </p>
        </div>
        <Button type="button" onClick={openNew} className="gap-2">
          <Plus className="size-4" />
          Nuevo proveedor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>Nombre, contacto y acceso a pedidos.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Proveedor</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 font-medium">Alta</th>
                <th className="px-4 py-3 text-right font-medium">Pedidos</th>
                <th className="px-4 py-3 text-right font-medium" />
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No hay proveedores. Creá el primero para usar pedidos.
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/app/proveedores/${s.id}`} className="font-medium text-primary hover:underline">
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {[s.phone, s.email].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(s.created_at)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{orderCounts[s.id] ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <Link
                          href={`/app/proveedores/${s.id}`}
                          className={cn(
                            "inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] bg-secondary px-2.5 text-[0.8rem] font-medium text-secondary-foreground hover:bg-secondary/80"
                          )}
                        >
                          <Truck className="size-3.5" />
                          Pedidos
                        </Link>
                        <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(s)} aria-label="Editar">
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(s)}
                          disabled={pending}
                          aria-label="Eliminar"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false);
              reset();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold">{editing ? "Editar proveedor" : "Nuevo proveedor"}</h2>
            <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
              <div className="grid gap-1.5">
                <Label htmlFor="p_name">Nombre</Label>
                <Input id="p_name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="p_phone">Teléfono</Label>
                <Input id="p_phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="p_email">Email</Label>
                <Input id="p_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="p_addr">Dirección</Label>
                <Input id="p_addr" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="p_tax">CUIT / ID fiscal</Label>
                <Input id="p_tax" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="p_notes">Notas</Label>
                <Input id="p_notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Guardando…" : "Guardar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
