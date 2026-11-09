"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import {
  AlertTriangle,
  BarChart3,
  Bell,
  Boxes,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Maximize2,
  Menu,
  Minimize2,
  Package,
  PackageCheck,
  CalendarClock,
  Clock3,
  PanelTopOpen,
  Receipt,
  Settings,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  TrendingUp,
  UserCircle2,
  Users,
  Wallet,
  X,
} from "lucide-react";

import femaleAvatar from "@/female.png";
import maleAvatar from "@/men.png";

import { signOut } from "@/app/auth/actions";
import { ActivitySessionPing } from "@/components/activity-session-ping";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import { TrialCountdown } from "@/components/trial-countdown";
import { Button } from "@/components/ui/button";
import { memberCanAccessAppPath } from "@/lib/employee-permissions";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Clase Tailwind para el color principal del ítem (icono/texto activo). */
  colorClass: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, colorClass: "text-emerald-500" },
  { href: "/app/pos", label: "Punto de venta", icon: ShoppingCart, colorClass: "text-emerald-500" },
  { href: "/app/inventory", label: "Inventario", icon: Boxes, colorClass: "text-sky-500" },
  { href: "/app/products", label: "Productos", icon: Package, colorClass: "text-violet-500" },
  { href: "/app/clientes", label: "Clientes", icon: Users, colorClass: "text-cyan-500" },
  { href: "/app/proveedores", label: "Proveedores", icon: Truck, colorClass: "text-amber-500" },
  { href: "/app/empleados", label: "Empleados", icon: UserCircle2, colorClass: "text-rose-500" },
  { href: "/app/etiquetas", label: "Etiquetas", icon: Tag, colorClass: "text-fuchsia-500" },
  { href: "/app/sales", label: "Ventas", icon: Receipt, colorClass: "text-indigo-500" },
  { href: "/app/facturacion", label: "Facturación", icon: FileText, colorClass: "text-teal-500" },
  { href: "/app/cash", label: "Caja", icon: Wallet, colorClass: "text-emerald-500" },
  { href: "/app/reports", label: "Reportes", icon: BarChart3, colorClass: "text-sky-500" },
  { href: "/app/subscription", label: "Suscripción", icon: CreditCard, colorClass: "text-purple-500" },
  { href: "/app/settings", label: "Configuración", icon: Settings, colorClass: "text-slate-500" },
];

const QUICK_ACCESS_ITEMS = [
  {
    href: "/app/pos",
    label: "Punto de venta",
    shortcut: "F1",
    icon: ShoppingCart,
    colorClass: "border-sky-200/60 bg-sky-500/25 hover:bg-sky-400/35",
    activeClass: "border-sky-100 bg-sky-400/45 ring-1 ring-sky-200/70",
    keyClass: "border-sky-100/40 bg-sky-950/25 text-sky-50",
  },
  {
    href: "/app/cash",
    label: "Caja diaria",
    shortcut: "F2",
    icon: Wallet,
    colorClass: "border-emerald-200/60 bg-emerald-500/25 hover:bg-emerald-400/35",
    activeClass: "border-emerald-100 bg-emerald-400/45 ring-1 ring-emerald-200/70",
    keyClass: "border-emerald-100/40 bg-emerald-950/25 text-emerald-50",
  },
  {
    href: "/app/products",
    label: "Productos",
    shortcut: "F3",
    icon: Package,
    colorClass: "border-violet-200/60 bg-violet-500/25 hover:bg-violet-400/35",
    activeClass: "border-violet-100 bg-violet-400/45 ring-1 ring-violet-200/70",
    keyClass: "border-violet-100/40 bg-violet-950/25 text-violet-50",
  },
] as const;

type Props = {
  children: React.ReactNode;
  business: {
    id: string | null;
    name: string | null;
  };
  user: {
    email: string | null;
    avatar?: string | null;
  };
  cash: {
    open: boolean;
  };
  access?: {
    role: string | null;
    permissions: Record<string, any> | null;
  };
  plan?: {
    label: string;
    name?: string;
    periodEndsAt?: string | null;
    /** ISO end of trial; muestra contador en sidebar */
    trialEndsAt?: string | null;
  };
};

type OperationalSummary = {
  revenueToday: number;
  ticketsToday: number;
  activeProducts: number;
  lowStock: number;
  expiring: number;
  updatedAt: string;
};

function userAvatarSrc(avatar?: string | null) {
  if (avatar === "female") return femaleAvatar;
  if (avatar === "male") return maleAvatar;
  return null;
}

function userInitials(email: string | null) {
  const base = (email ?? "").trim();
  if (!base) return "U";
  const name = base.split("@")[0] ?? base;
  const parts = name.split(/[._\-\s]+/).filter(Boolean);
  const letters = parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .filter(Boolean);
  return letters.join("") || name.slice(0, 2).toUpperCase();
}

function formatSubscriptionDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function NavLinks({
  navItems,
  pathname,
  iconOnly,
  onNavigate,
}: {
  navItems: NavItem[];
  pathname: string;
  iconOnly: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="grid gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => onNavigate?.()}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm transition-all duration-200",
              "text-muted-foreground hover:-translate-y-px hover:border-white/50 hover:bg-white/60 hover:text-foreground hover:shadow-sm dark:hover:border-blue-300/15 dark:hover:bg-blue-400/10",
              active ? "border-blue-300/45 bg-gradient-to-r from-blue-500/15 to-violet-500/10 text-foreground shadow-[0_8px_24px_-16px_rgba(37,99,235,.8)] dark:border-blue-300/20 dark:from-blue-500/20 dark:to-violet-500/15" : "",
              iconOnly ? "justify-center" : ""
            )}
            title={iconOnly ? item.label : undefined}
            aria-label={iconOnly ? item.label : undefined}
          >
            {active ? (
              <span className="absolute left-0 top-2 h-[calc(100%-16px)] w-1 rounded-r bg-[var(--pos-accent)]" />
            ) : null}
            <Icon
              className={cn(
                "size-4 shrink-0 transition-colors",
                item.colorClass,
                active ? "opacity-100" : "opacity-60 group-hover:opacity-100"
              )}
            />
            {iconOnly ? null : (
              <span
                className={cn(
                  "truncate transition-colors",
                  active ? "font-semibold" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children, business, user, cash, access, plan }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { toggle: toggleTheme } = useTheme();

  const [collapsed, setCollapsed] = React.useState(true);
  const [headerCollapsed, setHeaderCollapsed] = React.useState(false);
  const [operationalSummary, setOperationalSummary] = React.useState<OperationalSummary | null>(null);
  const [liveNow, setLiveNow] = React.useState<Date | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = React.useState(false);
  const [focusMode, setFocusMode] = React.useState(false);

  const navItems = React.useMemo(() => {
    const base = NAV_ITEMS;
    const role = access?.role ?? null;
    const perms = (access?.permissions ?? {}) as Record<string, unknown>;
    return base.filter((item) => memberCanAccessAppPath(item.href, role, perms));
  }, [access?.role, access?.permissions]);

  const quickAccessItems = React.useMemo(
    () => QUICK_ACCESS_ITEMS.filter((item) => navItems.some((navItem) => navItem.href === item.href)),
    [navItems]
  );

  const toggleFocusMode = React.useCallback(async () => {
    if (focusMode) {
      setFocusMode(false);
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
      return;
    }

    setMobileNavOpen(false);
    setMobileMoreOpen(false);
    setFocusMode(true);
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(() => undefined);
    }
  }, [focusMode]);

  React.useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setFocusMode(false);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  React.useEffect(() => {
    const shortcuts = new Map<string, string>(
      quickAccessItems.map((item) => [item.shortcut, item.href])
    );
    const onQuickAccess = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat) return;
      if (event.key === "F5") {
        event.preventDefault();
        event.stopImmediatePropagation();
        void toggleFocusMode();
        return;
      }
      if (event.key === "F7") {
        event.preventDefault();
        event.stopImmediatePropagation();
        toggleTheme();
        return;
      }
      const href = shortcuts.get(event.key);
      if (!href) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      router.push(href);
    };

    window.addEventListener("keydown", onQuickAccess, { capture: true });
    return () => window.removeEventListener("keydown", onQuickAccess, { capture: true });
  }, [quickAccessItems, router, toggleFocusMode, toggleTheme]);

  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!mobileNavOpen && !mobileMoreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileNavOpen(false);
        setMobileMoreOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen, mobileMoreOpen]);

  React.useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/app/operational-summary", { cache: "no-store" });
        if (!response.ok) return;
        const next = (await response.json()) as OperationalSummary;
        if (active) setOperationalSummary(next);
      } catch {
        // Conserva el último resumen visible si se corta momentáneamente la conexión.
      }
    };
    void refresh();
    const interval = window.setInterval(refresh, 20_000);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [business.id]);

  React.useEffect(() => {
    const updateClock = () => setLiveNow(new Date());
    updateClock();
    const interval = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const operationalMoney = React.useMemo(
    () => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }),
    []
  );

  const businessLabel = business.name ?? (business.id ? `${business.id.slice(0, 8)}…` : "Sin negocio");
  const mobilePrimaryHrefs = ["/app", "/app/products", "/app/pos", "/app/cash"];
  const mobileMoreItems = navItems.filter((item) => !mobilePrimaryHrefs.includes(item.href));

  return (
    <div className="app-shell-theme relative isolate min-h-dvh w-full overflow-x-hidden bg-[radial-gradient(circle_at_8%_16%,rgba(56,189,248,.22),transparent_28%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,.16),transparent_32%),radial-gradient(circle_at_72%_92%,rgba(34,211,238,.14),transparent_34%),linear-gradient(135deg,#f8fcff_0%,#edf7ff_46%,#f7fbff_100%)] dark:bg-[radial-gradient(circle_at_8%_18%,rgba(14,165,233,.32),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(124,58,237,.34),transparent_34%),radial-gradient(circle_at_72%_92%,rgba(34,211,238,.20),transparent_34%),linear-gradient(135deg,#07162d_0%,#0b2d5a_48%,#2b1f69_100%)]">
      <div aria-hidden="true" className="pointer-events-none fixed -left-32 top-1/3 -z-10 hidden size-96 rounded-full bg-cyan-400/10 blur-3xl dark:block" />
      <div aria-hidden="true" className="pointer-events-none fixed -right-32 bottom-0 -z-10 hidden size-[30rem] rounded-full bg-violet-400/15 blur-3xl dark:block" />
      <ActivitySessionPing businessId={business.id} />
      {mobileNavOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-hidden
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      {mobileMoreOpen ? (
        <div className="fixed inset-0 z-40 md:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
            aria-label="Cerrar más opciones"
            onClick={() => setMobileMoreOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-more-title"
            className="absolute inset-x-0 bottom-0 max-h-[78dvh] overflow-y-auto rounded-t-[28px] border-t border-white/20 bg-[var(--pos-bg)] px-4 pb-[calc(6.25rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-24px_70px_rgba(15,23,42,.35)]"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 id="mobile-more-title" className="text-lg font-bold">Más opciones</h2>
                <p className="text-sm text-muted-foreground">Administrá tu negocio</p>
              </div>
              <div className="flex items-center gap-1">
                <form action={signOut}>
                  <Button type="submit" variant="ghost" className="h-10 gap-2 px-3 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40">
                    <LogOut className="size-4" />
                    Salir
                  </Button>
                </form>
                <Button type="button" variant="ghost" size="icon" onClick={() => setMobileMoreOpen(false)} aria-label="Cerrar">
                  <X className="size-5" />
                </Button>
              </div>
            </div>

            <nav className="grid grid-cols-3 gap-3" aria-label="Más secciones">
              {mobileMoreItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMoreOpen(false)}
                    className={cn(
                      "flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface)] px-2 py-3 text-center text-xs font-semibold shadow-sm transition active:scale-[.97]",
                      active && "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                    )}
                  >
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-[var(--pos-surface-2)]">
                      <Icon className={cn("size-5", item.colorClass)} />
                    </span>
                    <span className="line-clamp-2">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

          </section>
        </div>
      ) : null}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(20rem,calc(100vw-2rem))] max-w-[100vw] flex-col border-r border-[var(--pos-border)] bg-[#f5f7fb] shadow-xl transition-transform duration-200 ease-out dark:bg-[var(--sidebar)]",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
        role="dialog"
        aria-modal={mobileNavOpen}
        aria-hidden={!mobileNavOpen}
        aria-label="Menú de navegación"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--pos-border)] p-4">
          <Link
            href="/app"
            className="flex min-w-0 flex-1 items-center gap-3"
            onClick={() => setMobileNavOpen(false)}
          >
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--pos-accent)] text-black shadow-[0_0_0_1px_var(--pos-glow)]">
              <ShoppingCart className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold tracking-tight">{businessLabel}</div>
              <div className="truncate text-xs text-muted-foreground">POS SaaS</div>
            </div>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks
            navItems={navItems}
            pathname={pathname}
            iconOnly={false}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </div>

        <div className="border-t border-[var(--pos-border)] p-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface-2)] text-sm font-semibold text-muted-foreground">
              {userAvatarSrc(user.avatar) ? (
                <Image
                  src={userAvatarSrc(user.avatar)!}
                  alt=""
                  width={40}
                  height={40}
                  className="size-10 object-cover"
                />
              ) : (
                userInitials(user.email)
              )}
            </span>
            <div className="min-w-0 text-sm">
              <div className="truncate font-medium">{user.email ?? "Usuario"}</div>
              <div className="text-xs text-muted-foreground">
                Plan: {plan?.label ?? "—"}
                {plan?.trialEndsAt ? (
                  <>
                    {" "}
                    · demo{" "}
                    <TrialCountdown endsAt={plan.trialEndsAt} variant="compact" className="inline text-xs" />
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={cn("flex min-h-dvh w-full gap-4 px-0 py-0 md:px-3 md:py-4", focusMode && "gap-0 md:px-0 md:py-0")}>
        <aside
          className={cn(
            "group/sidebar relative sticky top-4 hidden h-[calc(100dvh-2rem)] shrink-0 flex-col overflow-hidden rounded-[22px] border border-white/70 bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,.13),transparent_30%),linear-gradient(180deg,rgba(248,250,255,.98),rgba(238,243,252,.96))] shadow-[0_22px_60px_-38px_rgba(30,64,175,.65)] backdrop-blur-xl transition-[width,box-shadow] duration-300 ease-out md:flex dark:border-blue-300/15 dark:bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,.22),transparent_30%),linear-gradient(180deg,#111a2d,#0c1424)] dark:shadow-[0_24px_70px_-34px_rgba(37,99,235,.45)]",
            collapsed ? "w-20" : "w-72",
            focusMode && "md:hidden"
          )}
          onMouseEnter={() => setCollapsed(false)}
          onMouseLeave={() => setCollapsed(true)}
          onFocusCapture={() => setCollapsed(false)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setCollapsed(true);
          }}
          aria-label="Navegación principal"
        >
          <div aria-hidden="true" className="pointer-events-none absolute -left-12 top-24 size-32 rounded-full bg-cyan-300/10 blur-2xl dark:bg-cyan-400/10" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 bottom-20 size-40 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-500/15" />
          <div className="relative flex items-center justify-between gap-2 border-b border-blue-200/40 p-4 dark:border-blue-300/10">
            <Link href="/app" className="flex min-w-0 items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 shadow-[0_10px_28px_-10px_rgba(16,185,129,.85)] ring-1 ring-white/50">
                <ShoppingCart className="size-5" />
              </span>
              {collapsed ? null : (
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold tracking-tight">{businessLabel}</div>
                  <div className="truncate text-xs text-muted-foreground">POS SaaS</div>
                </div>
              )}
            </Link>

            {collapsed ? null : (
              <span className="rounded-full border border-blue-300/20 bg-blue-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">
                Automático
              </span>
            )}
          </div>

          <div className={cn("relative flex-1 overflow-y-auto p-2", collapsed ? "" : "p-3")}>
            <NavLinks navItems={navItems} pathname={pathname} iconOnly={collapsed} />
          </div>

          <div className="relative border-t border-blue-200/40 bg-white/20 p-4 backdrop-blur dark:border-blue-300/10 dark:bg-blue-950/10">
            <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "")}
            >
              <span className="inline-flex size-10 items-center justify-center overflow-hidden rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface-2)] text-sm font-semibold text-muted-foreground">
                {userAvatarSrc(user.avatar) ? (
                  <Image
                    src={userAvatarSrc(user.avatar)!}
                    alt="avatar"
                    width={40}
                    height={40}
                    className="size-10 object-cover"
                    priority
                  />
                ) : (
                  userInitials(user.email)
                )}
              </span>
              {collapsed ? null : (
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{user.email ?? "Usuario"}</div>
                  <div className="text-xs text-muted-foreground">
                    Plan: {plan?.label ?? "—"}
                    {plan?.trialEndsAt ? (
                      <>
                        {" "}
                        · demo{" "}
                        <TrialCountdown endsAt={plan.trialEndsAt} variant="compact" className="inline text-xs" />
                      </>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className={cn("flex min-w-0 flex-1 flex-col gap-0 md:gap-4", focusMode && "md:gap-0")}>
          <header
            className={cn(
              "relative isolate flex items-center justify-between gap-2 overflow-hidden border-blue-300/25 bg-[radial-gradient(ellipse_at_20%_120%,rgba(34,211,238,.8),transparent_30%),radial-gradient(ellipse_at_72%_-70%,rgba(168,85,247,.72),transparent_34%),linear-gradient(105deg,#0759b8_0%,#0b4fc1_38%,#2929a8_68%,#5b21b6_100%)] px-3 text-white shadow-[0_16px_40px_-18px_rgba(30,64,175,.9)] transition-all duration-300 sm:gap-3 sm:px-4 md:rounded-2xl md:border",
              headerCollapsed ? "py-1.5" : "py-2",
              focusMode && "hidden"
            )}
          >
            <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_18px_2px_rgba(34,211,238,.9)]" />
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Abrir menú"
                aria-expanded={mobileNavOpen}
              >
                <Menu className="size-5" />
              </Button>
              <div className={cn("hidden shrink-0 items-center gap-2 border-r border-white/20 pr-3 md:flex", headerCollapsed && "md:hidden")}>
                <span className="flex size-10 items-center justify-center rounded-xl border border-cyan-200/30 bg-gradient-to-br from-cyan-300/35 to-blue-700/55 shadow-[0_0_20px_rgba(34,211,238,.35)]"><Store className="size-5 text-white" /></span>
                <div className="min-w-0"><div className="truncate text-sm font-extrabold tracking-tight">{businessLabel}</div><div className="text-[10px] font-medium text-blue-100/75">Tienda360 · POS SaaS</div></div>
              </div>
              {!headerCollapsed ? (
                <div className="hidden min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] lg:flex [&::-webkit-scrollbar]:hidden">
                  <div className="flex shrink-0 items-center gap-2 rounded-lg border border-emerald-300/30 bg-emerald-500/20 px-2.5 py-1.5 shadow-inner"><TrendingUp className="size-4 text-emerald-200" /><div><div className="text-[8px] text-emerald-100/70">Ventas hoy</div><div className="text-xs font-extrabold">{operationalSummary ? operationalMoney.format(operationalSummary.revenueToday) : "—"}</div></div></div>
                  <div className="flex shrink-0 items-center gap-2 rounded-lg border border-cyan-300/25 bg-cyan-400/15 px-2.5 py-1.5"><Receipt className="size-4 text-cyan-200" /><div><div className="text-[8px] text-cyan-100/70">Tickets</div><div className="text-xs font-extrabold">{operationalSummary?.ticketsToday ?? "—"}</div></div></div>
                  <div className="flex shrink-0 items-center gap-2 rounded-lg border border-indigo-200/25 bg-indigo-300/15 px-2.5 py-1.5"><BarChart3 className="size-4 text-indigo-100" /><div><div className="text-[8px] text-indigo-100/70">Ticket prom.</div><div className="text-xs font-extrabold">{operationalSummary && operationalSummary.ticketsToday ? operationalMoney.format(operationalSummary.revenueToday / operationalSummary.ticketsToday) : "$ 0"}</div></div></div>
                  <div className="flex shrink-0 items-center gap-2 rounded-lg border border-violet-200/25 bg-violet-300/15 px-2.5 py-1.5"><PackageCheck className="size-4 text-violet-100" /><div><div className="text-[8px] text-violet-100/70">Productos</div><div className="text-xs font-extrabold">{operationalSummary?.activeProducts ?? "—"}</div></div></div>
                  <div className="hidden shrink-0 items-center gap-2 rounded-lg border border-amber-200/25 bg-amber-400/15 px-2.5 py-1.5 2xl:flex"><AlertTriangle className="size-4 text-amber-200" /><div><div className="text-[8px] text-amber-100/70">Stock bajo</div><div className="text-xs font-extrabold">{operationalSummary?.lowStock ?? "—"}</div></div></div>
                  <div className="hidden shrink-0 items-center gap-2 rounded-lg border border-fuchsia-200/25 bg-fuchsia-400/15 px-2.5 py-1.5 2xl:flex"><CalendarClock className="size-4 text-fuchsia-200" /><div><div className="text-[8px] text-fuchsia-100/70">Vencimientos</div><div className="text-xs font-extrabold">{operationalSummary?.expiring ?? "—"}</div></div></div>
                </div>
              ) : null}
            </div>

            <Link
              href="/app"
              className="absolute left-1/2 -translate-x-1/2 text-[22px] font-extrabold tracking-tight text-slate-900 md:hidden dark:text-white"
              aria-label="Ir al inicio"
            >
              Tienda<span className="text-blue-600">360</span>
            </Link>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {headerCollapsed ? (
                <Button type="button" variant="outline" size="icon" className="hidden size-9 rounded-xl border-blue-300/50 bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:text-white md:inline-flex" onClick={() => setHeaderCollapsed(false)} aria-label="Mostrar panel operativo" title="Mostrar panel operativo">
                  <PanelTopOpen className="size-4" />
                </Button>
              ) : null}
              <nav className="hidden items-center gap-1 md:flex" aria-label="Accesos rápidos">
                {quickAccessItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "inline-flex h-9 items-center gap-1.5 rounded-xl border px-2 text-[11px] font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
                        item.colorClass,
                        active && item.activeClass
                      )}
                      aria-keyshortcuts={item.shortcut}
                      title={`${item.label} (${item.shortcut})`}
                    >
                      <Icon className="size-4" />
                      <span className="hidden 2xl:inline">{item.label}</span>
                      <kbd className={cn("rounded border px-1 py-0.5 font-mono text-[9px] leading-none", item.keyClass)}>
                        {item.shortcut}
                      </kbd>
                    </Link>
                  );
                })}
              </nav>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="hidden size-9 rounded-xl border-cyan-200/60 bg-cyan-500/25 text-white shadow-sm hover:bg-cyan-400/40 hover:text-white md:inline-flex"
                onClick={() => void toggleFocusMode()}
                aria-label="Activar pantalla completa"
                aria-keyshortcuts="F5"
                title="Pantalla completa (F5)"
              >
                <Maximize2 className="size-4" />
              </Button>
              {!headerCollapsed ? (
                <Link
                  href="/app/subscription"
                  className="hidden max-w-[176px] items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-2.5 py-1.5 text-left text-white shadow-sm transition hover:bg-white/20 2xl:flex"
                  title={`${plan?.name ?? "Plan"} · ${plan?.periodEndsAt ? `Vigente hasta ${formatSubscriptionDate(plan.periodEndsAt) ?? "—"}` : plan?.name === "Vitalicio" ? "Sin vencimiento" : "Vigencia sin fecha registrada"}`}
                >
                  <CreditCard className="size-4 shrink-0 text-cyan-200" />
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-[11px] font-bold">Plan {plan?.name ?? "—"}</span>
                    <span className="block truncate text-[9px] text-blue-100/80">
                      {plan?.periodEndsAt
                        ? `Hasta ${formatSubscriptionDate(plan.periodEndsAt) ?? "—"}`
                        : plan?.name === "Vitalicio"
                          ? "Sin vencimiento"
                          : plan?.label ?? "Vigencia sin fecha"}
                    </span>
                  </span>
                </Link>
              ) : null}
              {!headerCollapsed ? <div className="hidden items-center gap-2 border-l border-white/20 pl-2 xl:flex"><Clock3 className="size-4 text-cyan-200" /><div className="text-right"><div className="text-[9px] font-medium text-blue-100/70">{liveNow ? new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(liveNow) : "—"}</div><div className="text-sm font-extrabold tabular-nums">{liveNow ? new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(liveNow) : "--:--"}</div></div><Bell className="size-4 text-white/80" /></div> : null}
              <span className="inline-flex rounded-xl bg-gradient-to-br from-sky-400 to-violet-600 p-px shadow-[0_8px_22px_-8px_rgba(59,130,246,.9)] [&_button]:size-9 [&_button]:rounded-[11px] [&_button]:bg-white/90 [&_button]:text-blue-700 [&_button]:hover:bg-white dark:[&_button]:bg-slate-950/85 dark:[&_button]:text-cyan-300 dark:[&_button]:hover:bg-slate-900">
                <ThemeToggle shortcut="F7" />
              </span>
              <form action={signOut} className="hidden md:block">
                <Button
                  type="submit"
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-xl border-rose-300/60 bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-[0_8px_22px_-8px_rgba(225,29,72,.9)] hover:from-rose-600 hover:to-red-700 hover:text-white dark:border-rose-300/25"
                  aria-label="Salir"
                  title="Salir"
                >
                  <LogOut className="size-4" />
                </Button>
              </form>
              {!headerCollapsed ? (
                <span className="hidden size-9 items-center justify-center overflow-hidden rounded-full border border-white/40 bg-white/90 text-xs font-extrabold text-blue-700 shadow-lg md:inline-flex">
                  {userAvatarSrc(user.avatar) ? <Image src={userAvatarSrc(user.avatar)!} alt="avatar" width={36} height={36} className="size-9 object-cover" /> : userInitials(user.email)}
                </span>
              ) : null}
              {!headerCollapsed ? (
                <Button type="button" variant="outline" size="icon" className="hidden size-9 rounded-xl border-slate-300/50 bg-white/75 text-slate-700 hover:bg-white hover:text-slate-950 md:inline-flex dark:border-white/15 dark:bg-slate-950/55 dark:text-slate-200" onClick={() => setHeaderCollapsed(true)} aria-label="Cerrar panel operativo" title="Cerrar panel operativo">
                  <X className="size-4" />
                </Button>
              ) : null}
            </div>
          </header>

          <main className={cn("min-w-0 flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0", focusMode && "pb-0")}>{children}</main>

          <nav className={cn("fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 items-end border-t border-slate-200/80 bg-white/95 px-2 pb-[max(.45rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-12px_35px_rgba(15,23,42,.14)] backdrop-blur-xl md:hidden dark:border-slate-800 dark:bg-slate-950/95", focusMode && "hidden")} aria-label="Navegación principal móvil">
            {[
              { href: "/app", label: "Inicio", Icon: LayoutDashboard },
              { href: "/app/products", label: "Productos", Icon: Package },
            ].map(({ href, label, Icon }) => {
              const active = pathname === href || (href !== "/app" && pathname.startsWith(href));
              return (
                <Link key={href} href={href} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold text-muted-foreground transition active:scale-95", active && "text-blue-600 dark:text-blue-400")}>
                  <Icon className="size-5" />
                  <span>{label}</span>
                </Link>
              );
            })}

            <Link href="/app/pos" className="group -mt-5 flex flex-col items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-300" aria-label="Abrir punto de venta">
              <span className={cn("flex size-14 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-[0_8px_24px_rgba(37,99,235,.4)] transition group-active:scale-95 dark:border-slate-950", pathname.startsWith("/app/pos") && "ring-4 ring-blue-500/20")}>
                <ShoppingCart className="size-6" />
              </span>
              <span>Vender</span>
            </Link>

            <Link href="/app/cash" className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold text-muted-foreground transition active:scale-95", pathname.startsWith("/app/cash") && "text-blue-600 dark:text-blue-400")}>
              <span className="relative">
                <Wallet className="size-5" />
                <span className={cn("absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-white dark:border-slate-950", cash.open ? "bg-emerald-500" : "bg-rose-500")} />
              </span>
              <span>Caja</span>
            </Link>

            <button type="button" onClick={() => setMobileMoreOpen(true)} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold text-muted-foreground transition active:scale-95", mobileMoreItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) && "text-blue-600 dark:text-blue-400")} aria-label="Abrir más opciones" aria-expanded={mobileMoreOpen}>
              <Menu className="size-5" />
              <span>Más</span>
            </button>
          </nav>

          {focusMode ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="fixed right-3 top-3 z-50 size-10 rounded-xl border-slate-300/60 bg-white/85 text-slate-700 opacity-40 shadow-lg backdrop-blur transition hover:opacity-100 dark:border-white/20 dark:bg-slate-950/80 dark:text-white"
              onClick={() => void toggleFocusMode()}
              aria-label="Salir de pantalla completa"
              aria-keyshortcuts="F5"
              title="Salir de pantalla completa (F5)"
            >
              <Minimize2 className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
