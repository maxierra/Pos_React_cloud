import { ShieldCheck, Lock, Mail, Server } from "lucide-react";

import { adminSignIn } from "@/app/admin/actions";
import { authAlertError } from "@/components/auth/auth-shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-zinc-950 overflow-hidden selection:bg-amber-500/30">
      {/* Background Decorators */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 opacity-30 blur-[120px] bg-amber-900/40 rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-900/30 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-yellow-900/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      </div>

      <div className="z-10 w-full max-w-md px-4">
        {/* Logo/Brand Area */}
        <div className="mb-8 flex flex-col items-center justify-center text-center">
          <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 p-0.5 shadow-[0_0_30px_rgba(217,119,6,0.5)]">
            <div className="flex size-full items-center justify-center rounded-[14px] bg-zinc-950/80 backdrop-blur-md">
              <Server className="size-6 text-amber-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Platform Admin</h1>
          <p className="mt-2 text-sm text-amber-200/60 max-w-[280px]">
            Área restringida. Ingrese sus credenciales de administrador.
          </p>
        </div>

        {/* Login Card */}
        <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          
          <div className="relative">
            {sp.error ? (
              <div className="mb-6">
                {authAlertError(sp.error)}
              </div>
            ) : null}

            <form action={adminSignIn} className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm font-medium text-amber-100/90">
                  Email de Administrador
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-500/50" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="h-11 border-white/10 bg-zinc-900/50 pl-9 text-white placeholder:text-amber-100/30 focus-visible:border-amber-500/50 focus-visible:bg-zinc-900/80 focus-visible:ring-1 focus-visible:ring-amber-500/50 transition-all"
                    placeholder="admin@plataforma.com"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-sm font-medium text-amber-100/90">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-500/50" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="h-11 border-white/10 bg-zinc-900/50 pl-9 text-white placeholder:text-amber-100/30 focus-visible:border-amber-500/50 focus-visible:bg-zinc-900/80 focus-visible:ring-1 focus-visible:ring-amber-500/50 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="group relative mt-2 flex h-11 w-full items-center justify-center overflow-hidden rounded-xl bg-orange-600 font-medium text-white shadow-[0_0_20px_rgba(234,88,12,0.4)] transition-all hover:bg-orange-500 hover:shadow-[0_0_30px_rgba(234,88,12,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <ShieldCheck className="size-4" />
                  Acceder a la Consola
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-amber-200/40">
          <p>© {new Date().getFullYear()} SaaS Platform. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}
