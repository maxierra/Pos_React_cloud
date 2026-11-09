"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, History, Mail, Pencil, Phone, Plus, Search, Trash2 } from "lucide-react";

import { ClienteHistorialModal } from "@/app/app/(main)/clientes/cliente-historial-modal";
import { deleteCustomer, saveCustomer } from "@/app/app/(main)/clientes/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ClienteRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  credit_limit: number;
  balance: number;
  /** Límite − deuda: cuánto puede gastar aún. */
  available_to_spend: number;
};

function moneyAr(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

function parseMoney(raw: string) {
  const n = Number(raw.replace(",", ".").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function ClientesClient({ rows: initialRows }: { rows: ClienteRow[] }) {
  const router = useRouter();
  const [rows, setRows] = React.useState(initialRows);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ClienteRow | null>(null);
  const [historialFor, setHistorialFor] = React.useState<ClienteRow | null>(null);
  const [query, setQuery] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [creditLimit, setCreditLimit] = React.useState("0");

  const resetForm = React.useCallback(() => {
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setCreditLimit("0");
    setEditing(null);
  }, []);

  const openNew = React.useCallback(() => {
    resetForm();
    setOpen(true);
  }, [resetForm]);

  const openEdit = React.useCallback((r: ClienteRow) => {
    setEditing(r);
    setName(r.name);
    setPhone(r.phone ?? "");
    setEmail(r.email ?? "");
    setAddress(r.address ?? "");
    setCreditLimit(String(r.credit_limit ?? 0));
    setOpen(true);
  }, []);

  const onSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      startTransition(() => {
        void (async () => {
          try {
            await saveCustomer({
              id: editing?.id,
              name,
              phone: phone || null,
              email: email || null,
              address: address || null,
              credit_limit: parseMoney(creditLimit),
            });
            toast.success(editing ? "Cliente actualizado" : "Cliente creado");
            setOpen(false);
            resetForm();
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
          }
        })();
      });
    },
    [address, creditLimit, editing, email, name, phone, resetForm, router]
  );

  const onDelete = React.useCallback(
    (r: ClienteRow) => {
      if (!confirm(`¿Eliminar a ${r.name}?`)) return;
      startTransition(() => {
        void (async () => {
          try {
            await deleteCustomer(r.id);
            toast.success("Cliente eliminado");
            router.refresh();
          } catch (err) {
            const msg = err instanceof Error ? err.message : "";
            if (msg.includes("no_se_puede_eliminar_con_deuda")) {
              toast.error("No se puede eliminar: el cliente tiene deuda pendiente.");
            } else {
              toast.error(msg || "Error");
            }
          }
        })();
      });
    },
    [router]
  );

  const filteredRows = React.useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    if (!normalized) return rows;
    return rows.filter((row) =>
      [row.name, row.phone, row.email, row.address]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("es").includes(normalized))
    );
  }, [query, rows]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 md:py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-5 md:mb-8 md:pb-8">
        <div className="max-w-xl space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Clientes</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Abrí el historial de cada cliente para ver compras, cobrar la deuda (total o parcial) y registrar el medio de
            pago.
          </p>
        </div>
        <Button type="button" onClick={openNew} className="h-11 w-full gap-2 rounded-xl shadow-sm sm:w-auto">
          <Plus className="size-4" />
          Nuevo cliente
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, teléfono o email" className="h-12 rounded-2xl bg-card pl-10" />
      </div>

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardHeader className="space-y-1 border-b bg-muted/20 pb-4">
          <CardTitle className="text-base font-semibold">Listado</CardTitle>
          <CardDescription className="text-sm">
            Límite, deuda, disponible para gastar y acceso al historial.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 md:overflow-x-auto md:p-0">
          <div className="grid gap-3 md:hidden">
            {filteredRows.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                {query ? "No encontramos clientes con esa búsqueda." : "No hay clientes. Creá el primero para usar cuenta corriente en el POS."}
              </div>
            ) : filteredRows.map((r) => (
              <article key={`mobile-${r.id}`} className="rounded-2xl border border-border/70 bg-[var(--pos-surface)] p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/app/clientes/${r.id}`} className="text-base font-bold text-foreground">{r.name}</Link>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {r.phone ? <a href={`tel:${r.phone}`} className="flex items-center gap-2"><Phone className="size-3.5" />{r.phone}</a> : null}
                      {r.email ? <a href={`mailto:${r.email}`} className="flex items-center gap-2 break-all"><Mail className="size-3.5" />{r.email}</a> : null}
                      {!r.phone && !r.email ? <span>Sin datos de contacto</span> : null}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" className="size-9" onClick={() => openEdit(r)} aria-label={`Editar a ${r.name}`}><Pencil className="size-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-destructive" onClick={() => onDelete(r)} aria-label={`Eliminar a ${r.name}`} disabled={pending}><Trash2 className="size-4" /></Button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800"><div className="text-[10px] font-semibold uppercase text-muted-foreground">Límite</div><div className="mt-1 text-xs font-bold">{moneyAr(r.credit_limit)}</div></div>
                  <div className="rounded-xl bg-amber-50 p-2.5 dark:bg-amber-950/30"><div className="text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-400">Deuda</div><div className="mt-1 text-xs font-bold text-amber-700 dark:text-amber-300">{moneyAr(r.balance)}</div></div>
                  <div className="rounded-xl bg-emerald-50 p-2.5 dark:bg-emerald-950/30"><div className="text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-400">Disponible</div><div className="mt-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">{moneyAr(r.available_to_spend)}</div></div>
                </div>

                <Button type="button" variant="secondary" className="mt-3 h-11 w-full justify-between rounded-xl" onClick={() => setHistorialFor(r)}>
                  <span className="flex items-center gap-2"><History className="size-4" /> Historial y cobros</span><CreditCard className="size-4 text-muted-foreground" />
                </Button>
              </article>
            ))}
          </div>

          <div className="hidden min-w-[720px] md:block">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 border-b bg-muted/60 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
                <tr>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">Contacto</th>
                  <th className="px-5 py-3.5 text-right">Límite</th>
                  <th className="px-5 py-3.5 text-right">Deuda</th>
                  <th className="px-5 py-3.5 text-right">Disponible</th>
                  <th className="px-5 py-3.5 text-right">Historial</th>
                  <th className="px-5 py-3.5 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center text-muted-foreground">
                      No hay clientes. Creá el primero para usar cuenta corriente en el POS.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r) => (
                    <tr
                      key={r.id}
                      className="transition-colors hover:bg-muted/40 even:bg-muted/[0.35]"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/app/clientes/${r.id}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {r.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {[r.phone, r.email].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-foreground">{moneyAr(r.credit_limit)}</td>
                      <td
                        className={
                          "px-5 py-3.5 text-right tabular-nums font-medium " +
                          (r.balance > 0.01 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")
                        }
                      >
                        {moneyAr(r.balance)}
                      </td>
                      <td
                        className={
                          "px-5 py-3.5 text-right tabular-nums font-medium " +
                          (r.available_to_spend > 0.01
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground")
                        }
                      >
                        {moneyAr(r.available_to_spend)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="gap-1.5 shadow-sm"
                          onClick={() => setHistorialFor(r)}
                        >
                          <History className="size-3.5" />
                          Ver historial
                        </Button>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex gap-0.5 rounded-lg border border-transparent p-0.5 hover:border-border">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-9 text-muted-foreground hover:text-foreground"
                            onClick={() => openEdit(r)}
                            aria-label="Editar"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-9 text-muted-foreground hover:text-destructive"
                            onClick={() => onDelete(r)}
                            aria-label="Eliminar"
                            disabled={pending}
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
          </div>
        </CardContent>
      </Card>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false);
              resetForm();
            }
          }}
        >
          <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] border bg-card p-5 shadow-xl sm:rounded-2xl sm:p-6">
            <h2 className="text-lg font-semibold">{editing ? "Editar cliente" : "Nuevo cliente"}</h2>
            <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
              <div className="grid gap-1.5">
                <Label htmlFor="c_name">Nombre</Label>
                <Input id="c_name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="c_phone">Teléfono</Label>
                <Input id="c_phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="c_email">Email</Label>
                <Input id="c_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="c_addr">Dirección</Label>
                <Input id="c_addr" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="c_limit">Límite de crédito (deuda máxima permitida)</Label>
                <Input
                  id="c_limit"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  required
                />
                <p className="text-[11px] text-muted-foreground">0 = no permite ventas en cuenta corriente.</p>
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
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

      <ClienteHistorialModal
        open={historialFor != null}
        summary={historialFor}
        onClose={() => setHistorialFor(null)}
      />
    </div>
  );
}
