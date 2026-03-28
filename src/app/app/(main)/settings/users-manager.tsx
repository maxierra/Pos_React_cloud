"use client";

import * as React from "react";
import { toast } from "sonner";
import { UserPlus, RefreshCw, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { createBusinessUser, listBusinessUsers, removeBusinessUser, restoreBusinessUser, updateBusinessUser, upsertMyProfile } from "@/app/app/(main)/settings/actions";

type Row = {
  user_id: string;
  role: string;
  permissions?: any;
  deleted_at?: string | null;
  email: string | null;
  full_name: string | null;
  avatar?: string | null;
};

export function UsersManager() {
  const [loading, startTransition] = React.useTransition();
  const [submitting, startSubmitTransition] = React.useTransition();
  const [rows, setRows] = React.useState<Row[]>([]);
  const [showDeactivated, setShowDeactivated] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Row | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editRole, setEditRole] = React.useState("member");
  const [editPerm, setEditPerm] = React.useState<any>({});
  const [editAvatar, setEditAvatar] = React.useState("");

  const [removeOpen, setRemoveOpen] = React.useState(false);
  const [removing, setRemoving] = React.useState<Row | null>(null);
  const [deleteAuth, setDeleteAuth] = React.useState(false);

  const [permOpen, setPermOpen] = React.useState(false);
  const [perm, setPerm] = React.useState({
    dashboard: false,
    pos: true,
    sales: false,
    cash: true,
    inventory: false,
    products: false,
    reports: false,
    settings: false,
    subscription: false,
  });

  const refresh = React.useCallback(() => {
    startTransition(async () => {
      await upsertMyProfile();
      const res = await listBusinessUsers();
      if ((res as any).error) {
        toast.error("No se pudieron cargar los usuarios", { description: String((res as any).error) });
        return;
      }
      setCurrentUserId(String((res as any).currentUserId ?? "") || null);
      setRows(((res as any).users ?? []) as Row[]);
    });
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const onCreate = (formData: FormData) => {
    formData.set("permissions", JSON.stringify(perm));
    startSubmitTransition(async () => {
      const res = await createBusinessUser(formData);
      if ((res as any).error) {
        toast.error("No se pudo crear el usuario", { description: String((res as any).error) });
        return;
      }
      toast.success("Usuario creado");
      refresh();
    });
  };

  const openEdit = (r: Row) => {
    setEditing(r);
    setEditName(r.full_name ?? "");
    setEditRole(r.role);
    setEditAvatar(r.avatar ?? "");
    const raw = (r.permissions ?? {}) as any;
    const normalized = { ...raw };
    if (normalized.pos == null && normalized.sales === true) {
      normalized.pos = true;
    }
    setEditPerm(normalized);
    setEditOpen(true);
  };

  const submitEdit = () => {
    if (!editing) return;
    startSubmitTransition(async () => {
      const fd = new FormData();
      fd.set("user_id", editing.user_id);
      fd.set("full_name", editName);
      fd.set("role", editRole);
      fd.set("avatar", editAvatar);
      fd.set("permissions", JSON.stringify(editPerm ?? {}));
      const res = await updateBusinessUser(fd);
      if ((res as any).error) {
        toast.error("No se pudo actualizar", { description: String((res as any).error) });
        return;
      }
      toast.success("Usuario actualizado");
      setEditOpen(false);
      setEditing(null);
      refresh();
    });
  };

  const openRemove = (r: Row) => {
    setRemoving(r);
    setDeleteAuth(false);
    setRemoveOpen(true);
  };

  const submitRemove = () => {
    if (!removing) return;
    startSubmitTransition(async () => {
      const fd = new FormData();
      fd.set("user_id", removing.user_id);
      fd.set("delete_auth", deleteAuth ? "1" : "0");
      const res = await removeBusinessUser(fd);
      if ((res as any).error) {
        toast.error("No se pudo eliminar", { description: String((res as any).error) });
        return;
      }
      toast.success(deleteAuth ? "Usuario eliminado" : "Usuario desactivado");
      setRemoveOpen(false);
      setRemoving(null);
      refresh();
    });
  };

  const restore = (r: Row) => {
    startSubmitTransition(async () => {
      const fd = new FormData();
      fd.set("user_id", r.user_id);
      const res = await restoreBusinessUser(fd);
      if ((res as any).error) {
        toast.error("No se pudo restaurar", { description: String((res as any).error) });
        return;
      }
      toast.success("Usuario restaurado");
      refresh();
    });
  };

  const visibleRows = React.useMemo(() => {
    if (showDeactivated) return rows;
    return rows.filter((r) => !r.deleted_at);
  }, [rows, showDeactivated]);

  return (
    <div className="grid gap-5">
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-tight">Empleados</div>
            <div className="text-xs text-muted-foreground">Usuarios con acceso a este comercio.</div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={showDeactivated}
                onChange={(e) => setShowDeactivated(e.target.checked)}
                className="size-4"
              />
              Ver desactivados
            </label>
            <Button type="button" variant="outline" className="h-9" onClick={refresh} disabled={loading || submitting}>
              <RefreshCw className={cn("mr-2 size-4", loading ? "animate-spin" : "")} />
              Actualizar
            </Button>
          </div>
        </div>

        {visibleRows.length === 0 ? (
          <div className="text-sm text-muted-foreground">No hay usuarios cargados.</div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Nombre</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Rol</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r) => (
                  <tr key={r.user_id} className="border-t">
                    <td className="px-3 py-2">
                      <div className="font-medium">{r.full_name || "—"}</div>
                      <div className="text-[11px] text-muted-foreground">{r.user_id.slice(0, 8)}…</div>
                    </td>
                    <td className="px-3 py-2">{r.email || "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-md border bg-background px-2 py-1 text-xs font-medium">
                          {r.role}
                        </span>
                        {r.deleted_at ? (
                          <span className="inline-flex rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
                            desactivado
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 px-2"
                          onClick={() => openEdit(r)}
                          disabled={submitting || r.user_id === currentUserId || !!r.deleted_at}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        {r.deleted_at ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 px-3"
                            onClick={() => restore(r)}
                            disabled={submitting || r.role === "owner"}
                          >
                            Restaurar
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 px-2 text-rose-600"
                            onClick={() => openRemove(r)}
                            disabled={submitting || r.role === "owner" || r.user_id === currentUserId}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            <UserPlus className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Crear usuario</div>
            <div className="text-xs text-muted-foreground">El dueño del comercio puede crear usuarios para empleados.</div>
          </div>
        </div>

        <form action={onCreate} className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="full_name">Nombre</Label>
              <Input id="full_name" name="full_name" placeholder="Juan Pérez" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="role">Rol</Label>
              <select
                id="role"
                name="role"
                defaultValue="member"
                className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="member">Empleado</option>
                <option value="owner">Dueño</option>
              </select>
            </div>
          </div>

          <div className="grid gap-1.5 sm:max-w-xs">
            <Label htmlFor="avatar">Avatar</Label>
            <select id="avatar" name="avatar" defaultValue="" className="h-10 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="">Sin avatar</option>
              <option value="male">Hombre</option>
              <option value="female">Mujer</option>
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="empleado@correo.com" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" placeholder="Mínimo 6 caracteres" required />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground">
              Permisos del empleado: <span className="font-medium text-foreground">{Object.entries(perm).filter(([, v]) => v).length}</span> habilitados
            </div>
            <Button type="button" variant="outline" className="h-9" onClick={() => setPermOpen(true)}>
              Configurar permisos
            </Button>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creando..." : "Crear usuario"}
            </Button>
          </div>

          <div className="text-[11px] text-muted-foreground">
            El usuario podrá iniciar sesión con su email y contraseña. Quedará asociado automáticamente a este comercio.
          </div>
        </form>
      </div>

      {permOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPermOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border bg-card shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
              <div>
                <div className="text-sm font-semibold tracking-tight">Permisos del empleado</div>
                <div className="text-xs text-muted-foreground">Elegí qué pantallas puede ver.</div>
              </div>
              <Button type="button" variant="outline" className="h-9" onClick={() => setPermOpen(false)}>
                Listo
              </Button>
            </div>
            <div className="grid gap-3 p-5 text-sm">
              {(
                [
                  { key: "dashboard", label: "Dashboard" },
                  { key: "pos", label: "Punto de venta" },
                  { key: "sales", label: "Ventas (historial)" },
                  { key: "cash", label: "Caja" },
                  { key: "inventory", label: "Inventario" },
                  { key: "products", label: "Productos" },
                  { key: "reports", label: "Reportes" },
                  { key: "settings", label: "Configuración" },
                  { key: "subscription", label: "Suscripción" },
                ] as const
              ).map((it) => (
                <label key={it.key} className="flex items-center justify-between gap-3 rounded-lg border bg-background px-4 py-3">
                  <span className="font-medium">{it.label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean((perm as any)[it.key])}
                    onChange={(e) => setPerm((p) => ({ ...p, [it.key]: e.target.checked }))}
                    className="size-4"
                  />
                </label>
              ))}
              <div className="text-[11px] text-muted-foreground">
                Esto se guarda en el comercio y luego lo usamos para ocultar secciones en el menú y pantallas.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editOpen && editing ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border bg-card shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
              <div>
                <div className="text-sm font-semibold tracking-tight">Editar usuario</div>
                <div className="text-xs text-muted-foreground">{editing.email ?? editing.user_id.slice(0, 8) + "…"}</div>
              </div>
              <Button type="button" variant="outline" className="h-9" onClick={() => setEditOpen(false)}>
                Cerrar
              </Button>
            </div>
            <div className="grid gap-3 p-5">
              <div className="grid gap-1.5">
                <Label htmlFor="edit_full_name">Nombre</Label>
                <Input id="edit_full_name" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit_role">Rol</Label>
                <select
                  id="edit_role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="member">Empleado</option>
                  <option value="owner">Dueño</option>
                </select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit_avatar">Avatar</Label>
                <select
                  id="edit_avatar"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">Sin avatar</option>
                  <option value="male">Hombre</option>
                  <option value="female">Mujer</option>
                </select>
              </div>

              <div className="grid gap-2">
                <div className="text-xs font-medium text-muted-foreground">Permisos</div>
                {(
                  [
                    { key: "dashboard", label: "Dashboard" },
                    { key: "pos", label: "Punto de venta" },
                    { key: "sales", label: "Ventas (historial)" },
                    { key: "cash", label: "Caja" },
                    { key: "inventory", label: "Inventario" },
                    { key: "products", label: "Productos" },
                    { key: "reports", label: "Reportes" },
                    { key: "settings", label: "Configuración" },
                    { key: "subscription", label: "Suscripción" },
                  ] as const
                ).map((it) => (
                  <label
                    key={it.key}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-background px-4 py-3"
                  >
                    <span className="text-sm font-medium">{it.label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean((editPerm as any)?.[it.key])}
                      onChange={(e) =>
                        setEditPerm((p: any) => ({ ...(p ?? {}), [it.key]: e.target.checked }))
                      }
                      className="size-4"
                    />
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={submitting}>
                  Cancelar
                </Button>
                <Button type="button" onClick={submitEdit} disabled={submitting}>
                  {submitting ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {removeOpen && removing ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setRemoveOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border bg-card shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
              <div>
                <div className="text-sm font-semibold tracking-tight">Eliminar usuario</div>
                <div className="text-xs text-muted-foreground">{removing.email ?? removing.user_id.slice(0, 8) + "…"}</div>
              </div>
              <Button type="button" variant="outline" className="h-9" onClick={() => setRemoveOpen(false)}>
                Cerrar
              </Button>
            </div>
            <div className="grid gap-3 p-5">
              <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                Por defecto, esto <span className="font-medium text-foreground">desactiva</span> al usuario solo en este comercio.
                El usuario no podrá entrar a este comercio mientras esté desactivado.
              </div>
              <label className="flex items-center justify-between gap-3 rounded-lg border bg-background px-4 py-3">
                <div>
                  <div className="text-sm font-medium">Eliminar cuenta completamente</div>
                  <div className="text-xs text-muted-foreground">Si lo activás, también se borra el usuario de Auth.</div>
                </div>
                <input type="checkbox" checked={deleteAuth} onChange={(e) => setDeleteAuth(e.target.checked)} className="size-4" />
              </label>

              <div className="text-[11px] text-muted-foreground">
                Si no eliminás la cuenta, luego podés restaurarlo desde la lista (Ver desactivados).
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setRemoveOpen(false)} disabled={submitting}>
                  Cancelar
                </Button>
                <Button type="button" className="bg-rose-600 text-white hover:bg-rose-700" onClick={submitRemove} disabled={submitting}>
                  {submitting ? "Eliminando..." : deleteAuth ? "Eliminar" : "Quitar acceso"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
