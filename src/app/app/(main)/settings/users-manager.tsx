"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  UserPlus,
  RefreshCw,
  Pencil,
  Trash2,
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Package,
  Users,
  Tag,
  BarChart3,
  CreditCard,
  Settings,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { createBusinessUser, listBusinessUsers, removeBusinessUser, restoreBusinessUser, updateBusinessUser, upsertMyProfile } from "@/app/app/(main)/settings/actions";
import {
  defaultEmployeePermissions,
  EMPLOYEE_PERMISSION_OPTIONS,
  normalizePermissionsFromStorage,
} from "@/lib/employee-permissions";

type Row = {
  user_id: string;
  role: string;
  permissions?: any;
  deleted_at?: string | null;
  email: string | null;
  full_name: string | null;
  avatar?: string | null;
};

const PERM_ICON: Record<
  string,
  { Icon: React.ComponentType<{ className?: string }>; color: string; bg: string; chip: string }
> = {
  dashboard: {
    Icon: LayoutDashboard,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    chip: "bg-emerald-500/10 text-emerald-600",
  },
  pos: {
    Icon: ShoppingCart,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    chip: "bg-emerald-500/10 text-emerald-600",
  },
  sales: {
    Icon: Wallet,
    color: "text-sky-600",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    chip: "bg-sky-500/10 text-sky-600",
  },
  cash: {
    Icon: Wallet,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    chip: "bg-amber-500/10 text-amber-700",
  },
  inventory: {
    Icon: Boxes,
    color: "text-sky-700",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    chip: "bg-sky-500/10 text-sky-700",
  },
  products: {
    Icon: Package,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    chip: "bg-violet-500/10 text-violet-600",
  },
  clientes: {
    Icon: Users,
    color: "text-cyan-700",
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    chip: "bg-cyan-500/10 text-cyan-700",
  },
  proveedores: {
    Icon: Users,
    color: "text-amber-700",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    chip: "bg-amber-500/10 text-amber-700",
  },
  empleados: {
    Icon: Users,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    chip: "bg-rose-500/10 text-rose-600",
  },
  etiquetas: {
    Icon: Tag,
    color: "text-fuchsia-600",
    bg: "bg-fuchsia-50 dark:bg-fuchsia-950/30",
    chip: "bg-fuchsia-500/10 text-fuchsia-600",
  },
  reports: {
    Icon: BarChart3,
    color: "text-indigo-600",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    chip: "bg-indigo-500/10 text-indigo-600",
  },
  subscription: {
    Icon: CreditCard,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    chip: "bg-purple-500/10 text-purple-600",
  },
  settings: {
    Icon: Settings,
    color: "text-slate-600",
    bg: "bg-slate-50 dark:bg-slate-950/30",
    chip: "bg-slate-500/10 text-slate-700",
  },
};

function PermissionCheckboxGrid({
  values,
  onToggle,
}: {
  values: Record<string, boolean>;
  onToggle: (key: string, checked: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {EMPLOYEE_PERMISSION_OPTIONS.map((it) => {
        const active = Boolean(values[it.key]);
        const meta = PERM_ICON[it.key] ?? {
          Icon: LayoutDashboard,
          color: "text-muted-foreground",
          bg: "bg-muted/40",
          chip: "bg-muted text-muted-foreground",
        };
        const Icon = meta.Icon;
        return (
          <label
            key={it.key}
            className={cn(
              "flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2.5 text-sm shadow-sm transition",
              active
                ? `${meta.bg} ${meta.color} border-transparent`
                : "border-[var(--pos-border)] bg-background hover:bg-[var(--pos-surface-2)]"
            )}
          >
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 accent-[var(--pos-accent)]"
              checked={active}
              onChange={(e) => onToggle(it.key, e.target.checked)}
            />
            <span className="min-w-0 space-y-1">
              <span className="flex items-center gap-1.5">
                <Icon className={cn("size-3.5", active ? "" : "text-muted-foreground")} />
                <span className="truncate font-medium leading-snug">{it.label}</span>
              </span>
              <span
                className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  active ? meta.chip : "bg-muted text-muted-foreground"
                )}
              >
                Solo ver
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

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
  const [editPerm, setEditPerm] = React.useState<Record<string, boolean>>({});
  const [editAvatar, setEditAvatar] = React.useState("");

  const [removeOpen, setRemoveOpen] = React.useState(false);
  const [removing, setRemoving] = React.useState<Row | null>(null);
  const [deleteAuth, setDeleteAuth] = React.useState(false);

  const [permOpen, setPermOpen] = React.useState(false);
  const [perm, setPerm] = React.useState<Record<string, boolean>>(() => defaultEmployeePermissions());

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
    formData.set("permissions", JSON.stringify({ ...defaultEmployeePermissions(), ...perm }));
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
    setEditPerm(normalizePermissionsFromStorage((r.permissions ?? {}) as Record<string, unknown>));
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
      fd.set("permissions", JSON.stringify({ ...defaultEmployeePermissions(), ...editPerm }));
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
          <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border bg-card shadow-xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4">
              <div>
                <div className="text-sm font-semibold tracking-tight">Permisos del empleado</div>
                <div className="text-xs text-muted-foreground">Elegí qué pantallas puede ver (grilla en 4 columnas en pantallas anchas).</div>
              </div>
              <Button type="button" variant="outline" className="h-9 shrink-0" onClick={() => setPermOpen(false)}>
                Listo
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="space-y-4">
                    <div>
                  <div className="text-xs font-medium text-muted-foreground">Pantallas visibles</div>
                  <p className="mb-2 text-[11px] text-muted-foreground">
                    Tildá qué secciones del menú puede abrir este empleado. Estos permisos solo dan acceso de{" "}
                    <span className="font-semibold">lectura básica</span>.
                  </p>
                  <PermissionCheckboxGrid
                    values={perm}
                    onToggle={(key, checked) => setPerm((p) => ({ ...p, [key]: checked }))}
                  />
                </div>

                <div className="rounded-xl border border-dashed border-[var(--pos-border)] bg-muted/30 p-3">
                  <div className="text-xs font-semibold text-muted-foreground">Configuraciones especiales</div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Acá definís si además de ver la pantalla puede hacer acciones sensibles.{" "}
                    <span className="font-semibold">Si no está tildado, esa acción queda bloqueada.</span>
                  </p>
                  <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2">
                      <input
                        type="checkbox"
                        className="size-4 shrink-0 accent-[var(--pos-accent)]"
                        checked={Boolean(perm.sales_void)}
                        onChange={(e) => setPerm((p) => ({ ...p, sales_void: e.target.checked }))}
                      />
                      <span className="min-w-0">
                        <span className="font-medium text-foreground">Puede anular ventas</span>
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          Controla el acceso al botón &quot;Anular&quot; en el historial de ventas.
                        </span>
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2">
                      <input
                        type="checkbox"
                        className="size-4 shrink-0 accent-[var(--pos-accent)]"
                        checked={Boolean(perm.products_edit_price)}
                        onChange={(e) => setPerm((p) => ({ ...p, products_edit_price: e.target.checked }))}
                      />
                      <span className="min-w-0">
                        <span className="font-medium text-foreground">Puede editar precios</span>
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          Si está desactivado, el precio queda solo de lectura en la edición de productos.
                        </span>
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2">
                      <input
                        type="checkbox"
                        className="size-4 shrink-0 accent-[var(--pos-accent)]"
                        checked={Boolean(perm.products_edit_stock)}
                        onChange={(e) => setPerm((p) => ({ ...p, products_edit_stock: e.target.checked }))}
                      />
                      <span className="min-w-0">
                        <span className="font-medium text-foreground">Puede editar stock</span>
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          Si está desactivado, el stock manual de productos queda bloqueado.
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
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
          <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border bg-card shadow-xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4">
              <div>
                <div className="text-sm font-semibold tracking-tight">Editar usuario</div>
                <div className="text-xs text-muted-foreground">{editing.email ?? editing.user_id.slice(0, 8) + "…"}</div>
              </div>
              <Button type="button" variant="outline" className="h-9 shrink-0" onClick={() => setEditOpen(false)}>
                Cerrar
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="grid gap-1.5">
                <Label htmlFor="edit_full_name">Nombre</Label>
                <Input id="edit_full_name" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="mt-3 grid gap-1.5 sm:grid-cols-2 sm:gap-4">
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
              </div>

              <div className="mt-5 grid gap-3">
                <div className="space-y-3">
                  <div className="text-xs font-medium text-muted-foreground">
                    Permisos (pantallas y acciones dentro de cada una)
                  </div>
                  <PermissionCheckboxGrid
                    values={editPerm}
                    onToggle={(key, checked) =>
                      setEditPerm((p) => ({ ...defaultEmployeePermissions(), ...(p ?? {}), [key]: checked }))
                    }
                  />

                  <div className="grid gap-2 text-xs sm:grid-cols-2">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2">
                      <input
                        type="checkbox"
                        className="size-4 shrink-0 accent-[var(--pos-accent)]"
                        checked={Boolean(editPerm.sales_void)}
                        onChange={(e) =>
                          setEditPerm((p) => ({
                            ...defaultEmployeePermissions(),
                            ...(p ?? {}),
                            sales_void: e.target.checked,
                          }))
                        }
                      />
                      <span className="min-w-0">
                        <span className="font-medium text-foreground">Puede anular ventas</span>
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2">
                      <input
                        type="checkbox"
                        className="size-4 shrink-0 accent-[var(--pos-accent)]"
                        checked={Boolean(editPerm.products_edit_price)}
                        onChange={(e) =>
                          setEditPerm((p) => ({
                            ...defaultEmployeePermissions(),
                            ...(p ?? {}),
                            products_edit_price: e.target.checked,
                          }))
                        }
                      />
                      <span className="min-w-0">
                        <span className="font-medium text-foreground">Puede editar precios</span>
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2">
                      <input
                        type="checkbox"
                        className="size-4 shrink-0 accent-[var(--pos-accent)]"
                        checked={Boolean(editPerm.products_edit_stock)}
                        onChange={(e) =>
                          setEditPerm((p) => ({
                            ...defaultEmployeePermissions(),
                            ...(p ?? {}),
                            products_edit_stock: e.target.checked,
                          }))
                        }
                      />
                      <span className="min-w-0">
                        <span className="font-medium text-foreground">Puede editar stock</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 justify-end gap-2 border-t border-[var(--pos-border)] bg-[var(--pos-surface)] px-5 py-4">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="button" onClick={submitEdit} disabled={submitting}>
                {submitting ? "Guardando..." : "Guardar"}
              </Button>
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
