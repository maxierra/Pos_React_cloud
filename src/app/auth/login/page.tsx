import Link from "next/link";
import { ArrowRight, BarChart3, Boxes, EyeOff, Lock, Mail, MessageCircle, MonitorSmartphone, ShieldCheck, ShoppingCart, Store, Wallet, Zap } from "lucide-react";

import { signIn } from "@/app/auth/actions";
import {
  AuthEyebrow,
  AuthFormBody,
  AuthFormFooter,
  AuthFormHeader,
  AuthFormSurface,
  AuthMarketingPanel,
  AuthPrimaryButton,
  AuthTextLink,
  authCommerceHeroImageUrl,
  authAlertError,
  authAlertSuccess,
  authInputClassName,
  authInputIconClassName,
  authLabelClassName,
  authPageBackgroundClass,
} from "@/components/auth/auth-shared";
import { AuthSiteHeader } from "@/components/auth/auth-site-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  searchParams?: Promise<{ error?: string; success?: string; redirect?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};

  return (
    <div className={authPageBackgroundClass}>
      <div className="hidden lg:block">
        <AuthSiteHeader secondaryHref="/auth/register" secondaryLabel="Crear cuenta" />
      </div>

      <main className="flex w-full flex-1 lg:mx-auto lg:max-w-7xl lg:items-center lg:px-4 lg:py-12">
        <section className="relative min-h-dvh w-full overflow-y-auto bg-[#071426] lg:hidden">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[610px] bg-cover bg-center" style={{ backgroundImage: `url(${authCommerceHeroImageUrl})` }} />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,39,82,.78)_0%,rgba(5,49,101,.94)_46%,#ddecfa_83%,#eef7ff_100%)]" />

          <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.1rem,env(safe-area-inset-top))]">
            <header className="flex items-center justify-between pt-2">
              <Link href="/" className="flex items-center gap-2.5 text-white">
                <span className="flex size-10 items-center justify-center rounded-[14px] border border-white/20 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,.2),0_10px_28px_rgba(0,0,0,.2)] backdrop-blur">
                  <ShoppingCart className="size-5" />
                </span>
                <span className="text-xl font-black tracking-tight">Tienda<span className="text-sky-400">360</span></span>
              </Link>
            </header>

            <div className="pb-5 pt-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-300">
                <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-emerald-300" /></span>
                Sistema operativo
              </div>
              <h1 className="mt-4 text-[32px] font-black leading-[1.08] tracking-[-0.035em] text-white">Todo tu negocio,<br /><span className="text-sky-400">en la palma de tu mano</span></h1>
              <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-blue-100">Entrá a tu espacio de trabajo y seguí vendiendo sin perder el ritmo.</p>

              <div className="mt-5 grid grid-cols-3 gap-2.5">
                {[
                  { label: "Ventas ágiles", icon: BarChart3, tone: "text-sky-400" },
                  { label: "Caja al día", icon: Wallet, tone: "text-emerald-400" },
                  { label: "Stock real", icon: Boxes, tone: "text-violet-400" },
                ].map(({ label, icon: Icon, tone }) => (
                  <div key={label} className="rounded-2xl border border-white/20 bg-white/[.08] px-2 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.1)] backdrop-blur-md">
                    <Icon className={cn("mx-auto mb-2 size-6", tone)} />
                    <span className="text-[11px] font-semibold text-white">{label}</span>
                  </div>
                ))}
              </div>
            </div>

          <div className="rounded-[28px] border border-white/90 bg-white p-6 shadow-[0_28px_80px_rgba(0,34,78,.32)]">
            <div className="mb-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">¡Bienvenido!</h2>
                  <p className="mt-1 text-sm text-slate-400">Ingresá con tus datos de acceso</p>
                </div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><ShieldCheck className="size-5" /></span>
              </div>
            </div>
            {sp.error ? authAlertError(sp.error) : null}
            {sp.success === "password_updated" ? authAlertSuccess("Contraseña actualizada. Ingresá con tu nueva contraseña.") : null}

            <form action={signIn} className="grid gap-5">
              <input type="hidden" name="redirect" value={sp.redirect ?? ""} />
              <div className="grid gap-2">
                <Label htmlFor="mobile-email" className="sr-only">Email</Label>
                <div className="relative">
                  <Mail className={authInputIconClassName} />
                  <Input id="mobile-email" name="email" type="email" required autoComplete="email" inputMode="email" className={cn(authInputClassName, "h-14 rounded-2xl border-0 bg-slate-100/80 text-base shadow-none focus-visible:bg-white focus-visible:ring-2")} placeholder="nombre@comercio.com" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mobile-password" className="sr-only">Contraseña</Label>
                <div className="relative">
                  <Lock className={authInputIconClassName} />
                  <Input id="mobile-password" name="password" type="password" required autoComplete="current-password" className={cn(authInputClassName, "h-14 rounded-2xl border-0 bg-slate-100/80 pr-11 text-base shadow-none focus-visible:bg-white focus-visible:ring-2")} placeholder="Ingresá tu contraseña" />
                  <EyeOff className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs">
                <label className="flex items-center gap-2 text-slate-600"><input type="checkbox" name="remember" defaultChecked className="size-4 rounded border-slate-300 accent-blue-600" /> Recordarme</label>
                <AuthTextLink href="/auth/reset" className="text-xs">¿La olvidaste?</AuthTextLink>
              </div>
              <button type="submit" className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 text-base font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,.3)] transition active:scale-[.99]">
                Iniciar sesión <ArrowRight className="size-5" />
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" /><span>o</span><span className="h-px flex-1 bg-slate-200" /></div>
            <Link href="/auth/register" className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-blue-50 text-sm font-bold text-blue-600 transition active:scale-[.99]">
              <Store className="size-4" /> Crear una cuenta
            </Link>
            <div className="mt-5 border-t border-slate-200 pt-4 text-center">
              <p className="text-xs font-bold text-slate-600">¿Necesitás ayuda?</p>
              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold text-blue-700">
                <a className="inline-flex items-center gap-1.5" href="mailto:soporte@tienda360.site"><Mail className="size-4" />soporte@tienda360.site</a>
                <a className="inline-flex items-center gap-1.5" href="https://wa.me/5491123145742" target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" />WhatsApp</a>
              </div>
            </div>
          </div>

            <div className="mt-7 grid grid-cols-3 divide-x divide-slate-300/80 text-center text-[10px] leading-tight text-slate-700">
              <div className="px-2"><ShieldCheck className="mx-auto mb-2 size-5 text-emerald-500" />Tus datos<br />protegidos</div>
              <div className="px-2"><MonitorSmartphone className="mx-auto mb-2 size-5 text-blue-500" />Acceso seguro<br />desde cualquier lugar</div>
              <div className="px-2"><Zap className="mx-auto mb-2 size-5 text-violet-500" />Tu negocio<br />siempre en marcha</div>
            </div>
          </div>
        </section>

        <div className="hidden w-full gap-10 lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-12">
          <AuthMarketingPanel
            headline="Gestioná tu comercio con velocidad y claridad."
            description="Ventas, caja, inventario e informes en una plataforma pensada para el día a día en el mostrador."
            features={[
              { icon: ShieldCheck, text: "Acceso seguro y recuperación de contraseña." },
              { icon: BarChart3, text: "Métricas en vivo para decidir mejor." },
            ]}
          />

          <div className="flex items-center justify-center lg:justify-end">
            <AuthFormSurface>
              <AuthFormHeader
                eyebrow={
                  <AuthEyebrow>
                    <Store className="size-3.5 text-sky-600" />
                    Acceso profesional
                  </AuthEyebrow>
                }
                title="Ingresar"
                description="Accedé a tu punto de venta."
              >
                {sp.error ? authAlertError(sp.error) : null}
                {sp.success === "password_updated" ? (
                  authAlertSuccess("Contraseña actualizada. Ingresá con tu nueva contraseña.")
                ) : null}
              </AuthFormHeader>

              <AuthFormBody>
                <form action={signIn} className="grid gap-5">
                  <input type="hidden" name="redirect" value={sp.redirect ?? ""} />
                  <div className="grid gap-2">
                    <Label htmlFor="email" className={authLabelClassName}>
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className={authInputIconClassName} />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        className={cn(authInputClassName)}
                        placeholder="dueño@minegocio.com"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className={authLabelClassName}>
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Lock className={authInputIconClassName} />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        autoComplete="current-password"
                        className={cn(authInputClassName)}
                        placeholder="Tu contraseña"
                      />
                    </div>
                  </div>
                  <AuthPrimaryButton>Entrar</AuthPrimaryButton>
                </form>
              </AuthFormBody>

              <AuthFormFooter>
                <AuthTextLink href="/auth/reset">Olvidé mi contraseña</AuthTextLink>
                <p className="text-sm text-slate-600">
                  ¿No tenés cuenta?{" "}
                  <Link
                    href="/auth/register"
                    className="font-semibold text-sky-800 underline-offset-4 hover:text-sky-950 hover:underline"
                  >
                    Crear cuenta
                  </Link>
                </p>
                <div className="border-t border-cyan-300/15 pt-3 text-xs text-blue-100/75">
                  <p className="font-semibold text-white">¿Necesitás ayuda?</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                    <a className="inline-flex items-center gap-1.5 hover:text-cyan-200" href="mailto:soporte@tienda360.site"><Mail className="size-4" />soporte@tienda360.site</a>
                    <a className="inline-flex items-center gap-1.5 hover:text-cyan-200" href="https://wa.me/5491123145742" target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" />WhatsApp</a>
                  </div>
                </div>
              </AuthFormFooter>
            </AuthFormSurface>
          </div>
        </div>
      </main>
    </div>
  );
}
