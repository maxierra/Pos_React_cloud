import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, Package, ShoppingCart, Store, Wallet } from "lucide-react";

import { createBusiness } from "@/app/app/setup/actions";
import { SetupForm } from "@/app/app/setup/setup-form";
import { SetupIntroGate } from "@/app/app/setup/setup-intro-gate";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams?: Promise<{ error?: string; form?: string; plan?: string }>;
};

export default async function SetupPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const selectedPlan = ["monthly", "semester", "annual"].includes(sp.plan ?? "") ? sp.plan! : "";
  const showForm = sp.form === "1" || Boolean(sp.error);

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (authData.user) {
    const { data: memberships } = await supabase
      .from("memberships")
      .select("business_id")
      .eq("user_id", authData.user.id)
      .is("deleted_at", null)
      .limit(1);
    if (memberships && memberships.length > 0) {
      redirect(selectedPlan ? `/app/subscription?plan=${selectedPlan}&autostart=1` : "/app/products?ob=product");
    }
  }

  return (
    <SetupIntroGate showForm={showForm} selectedPlan={selectedPlan}>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-[#06112f] text-white">
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden"><div className="absolute -left-40 top-24 size-[34rem] rounded-full bg-violet-600/25 blur-[110px]" /><div className="absolute right-[-10rem] top-[-10rem] size-[38rem] rounded-full bg-blue-500/20 blur-[130px]" /><div className="absolute bottom-[-16rem] left-1/3 size-[42rem] rounded-full bg-cyan-500/15 blur-[130px]" /></div>

        <main className="relative mx-auto flex min-h-dvh w-full max-w-[1220px] flex-col px-4 py-5 sm:px-7 lg:px-10 lg:py-7">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_30px_rgba(34,211,238,.35)]"><ShoppingCart className="size-6" /></div><div><div className="text-2xl font-black">Tienda<span className="text-cyan-300">360</span></div><div className="text-[11px] uppercase tracking-[0.22em] text-blue-200/70">Punto de venta</div></div></div>
            <ol className="grid w-full grid-cols-4 gap-2 lg:max-w-2xl">
              {[{ label: "Comercio", icon: Store }, { label: "Producto", icon: Package }, { label: "Caja", icon: Wallet }, { label: "Venta", icon: ShoppingCart }].map(({ label, icon: Icon }, index) => <li key={label} className="relative flex flex-col items-center text-center">{index > 0 ? <span className="absolute right-1/2 top-4 h-px w-full bg-white/25" /> : null}<span className={index === 0 ? "relative z-10 flex size-9 items-center justify-center rounded-full border border-cyan-200 bg-cyan-400 text-[#07142f] shadow-[0_0_22px_rgba(34,211,238,.8)]" : "relative z-10 flex size-9 items-center justify-center rounded-full border border-white/50 bg-[#111d43] text-white/80"}>{index === 0 ? <Icon className="size-4" /> : index + 1}</span><span className="mt-1.5 text-[10px] font-semibold sm:text-xs">{label}</span></li>)}
            </ol>
          </header>

          <div className="grid flex-1 items-center gap-8 py-7 lg:grid-cols-[0.72fr_1fr] lg:gap-12 lg:py-9">
            <section className="hidden lg:block">
              <div className="flex size-24 items-center justify-center rounded-[28px] border border-cyan-300/25 bg-gradient-to-br from-cyan-400/20 to-violet-500/20 shadow-[0_0_50px_rgba(34,211,238,.22)]"><Store className="size-12 text-cyan-300" /></div>
              <h1 className="mt-7 text-4xl font-black leading-tight tracking-[-0.04em] xl:text-5xl">Creá tu negocio en <span className="text-cyan-300">Tienda360</span></h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-blue-100/75">Registrá los datos principales y dejá el sistema listo para cargar productos y empezar a vender.</p>
              <ul className="mt-7 grid gap-3 text-sm font-semibold text-blue-50/90">{["Configuración rápida", "Carga de productos", "Apertura de caja", "Primera venta guiada"].map((item) => <li key={item} className="flex items-center gap-2.5"><CheckCircle2 className="size-5 text-emerald-300" />{item}</li>)}</ul>
            </section>

            <section className="w-full max-w-[680px] justify-self-end overflow-hidden rounded-[30px] border border-white/70 bg-white text-slate-900 shadow-[0_35px_100px_-30px_rgba(0,0,0,.65)]">
              <div className="p-5 sm:p-7 xl:p-8">
                <div className="flex items-center justify-center gap-3"><div className="flex size-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700"><Store className="size-6" /></div><h2 className="text-3xl font-black tracking-tight">Crear tu <span className="text-violet-600">negocio</span></h2></div>
                <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">Completá los datos principales. Después te llevamos directamente a cargar tu primer producto.</p>
                {sp.error ? <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">{sp.error}</div> : null}
                <div className="mt-6"><SetupForm action={createBusiness} selectedPlan={selectedPlan} /></div>
                <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400"><span>Paso 1 de 4</span><ArrowRight className="size-3.5" /><span>Siguiente: productos</span></div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </SetupIntroGate>
  );
}
