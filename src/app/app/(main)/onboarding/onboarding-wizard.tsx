"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  LayoutDashboard,
  ReceiptText,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { completeBusinessOnboarding } from "@/app/app/(main)/onboarding/actions";
import { OnboardingIntroModal } from "@/app/app/(main)/onboarding/onboarding-intro-modal";
import { landingCtaPrimary } from "@/components/landing/landing-cta-classes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  businessName: string;
  productCount: number;
  cashOpen: boolean;
  paidSaleCount: number;
  showCelebration: boolean;
  celebrateFlash: boolean;
};

export function OnboardingWizard({
  businessName,
  showCelebration,
  celebrateFlash,
}: Props) {
  const router = useRouter();
  const [finishing, setFinishing] = React.useState(false);

  const onFinishOnboarding = React.useCallback(async () => {
    setFinishing(true);
    try {
      const result = await completeBusinessOnboarding();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("¡Listo! Ya podés usar el sistema con tranquilidad.");
      router.push("/app");
      router.refresh();
    } finally {
      setFinishing(false);
    }
  }, [router]);

  if (showCelebration) {
    return (
      <div className="relative isolate mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-5xl items-center justify-center overflow-hidden px-3 py-5 sm:px-6 sm:py-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_44%,#ecfdf5_100%)] dark:bg-[linear-gradient(135deg,#07142c_0%,#0f172a_50%,#052e2b_100%)]" />
        <div aria-hidden className="pointer-events-none absolute -left-24 bottom-[-10rem] -z-10 size-96 rounded-full bg-cyan-300/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-24 top-[-10rem] -z-10 size-96 rounded-full bg-emerald-300/35 blur-3xl" />
        {celebrateFlash ? <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-1/2 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,.26),transparent_62%)]" /> : null}

        <motion.section
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full overflow-hidden rounded-[2rem] border border-white/90 bg-white/90 p-5 shadow-[0_30px_90px_-35px_rgba(15,118,110,.38)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/88 sm:p-8 lg:grid lg:grid-cols-[.82fr_1.18fr] lg:gap-9 lg:p-10"
        >
          <div className="relative mx-auto flex w-full max-w-sm items-center justify-center py-2 sm:py-4 lg:max-w-none">
            <div aria-hidden className="absolute size-52 rounded-full bg-gradient-to-br from-cyan-200/70 to-emerald-200/70 blur-2xl dark:from-cyan-900/50 dark:to-emerald-900/50" />
            <div className="relative flex h-44 w-full max-w-[300px] items-end justify-center sm:h-52">
              <div className="absolute bottom-2 h-5 w-64 rounded-[50%] bg-cyan-900/10 blur-md dark:bg-black/35" />
              <div className="absolute bottom-8 left-4 z-10 flex size-20 rotate-[-5deg] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <ReceiptText className="size-8 text-cyan-600" />
                <span className="mt-1 text-[9px] font-bold uppercase tracking-widest">Venta OK</span>
              </div>
              <div className="relative z-0 flex h-40 w-40 flex-col items-center overflow-hidden rounded-[1.7rem] border border-blue-200 bg-white shadow-2xl dark:border-blue-900 dark:bg-slate-900 sm:h-48 sm:w-48">
                <div className="h-12 w-full bg-[repeating-linear-gradient(90deg,#0284c7_0_27px,#f8fafc_27px_54px)] sm:h-14" />
                <Store className="mt-5 size-14 text-blue-600" strokeWidth={1.7} />
                <div className="mt-3 h-3 w-24 rounded-full bg-blue-100 dark:bg-blue-950" />
              </div>
              <div className="absolute bottom-2 right-2 z-20 flex size-24 items-center justify-center rounded-full border-[7px] border-white bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_14px_30px_-10px_rgba(5,150,105,.8)] dark:border-slate-950">
                <Check className="size-12" strokeWidth={3.5} />
              </div>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35 }} className="absolute right-0 top-3 flex items-end gap-1 text-emerald-600">
                <BarChart3 className="size-12" />
                <TrendingUp className="mb-7 size-8" />
              </motion.div>
            </div>
          </div>

          <div className="flex flex-col justify-center text-center lg:text-left">
            <div className="mx-auto inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[.15em] text-emerald-700 ring-1 ring-emerald-200 lg:mx-0 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800">
              <Sparkles className="size-3.5" /> Recorrido completado
            </div>
            <h1 className="mt-4 text-balance text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
              ¡Primera venta <span className="text-emerald-600">registrada!</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base lg:mx-0 dark:text-slate-300">
              Ya cobraste en modo de prueba y <span className="font-bold text-slate-900 dark:text-white">{businessName}</span> quedó listo para trabajar en Tienda360.
            </p>

            <ul className="mt-5 grid gap-2 text-left text-sm sm:grid-cols-3 lg:grid-cols-1">
              {[
                { icon: ShoppingCart, text: "Seguí vendiendo desde Punto de venta." },
                { icon: Boxes, text: "Controlá productos e inventario." },
                { icon: BarChart3, text: "Consultá caja e informes cuando quieras." },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2.5 text-slate-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-slate-200">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm dark:bg-slate-900"><Icon className="size-4" /></span>
                  <span className="font-medium leading-5">{text}</span>
                </li>
              ))}
            </ul>

            <Button
              type="button"
              disabled={finishing}
              className={cn("mt-5 h-13 w-full rounded-2xl text-base font-bold shadow-[0_16px_32px_-14px_rgba(5,150,105,.8)]", landingCtaPrimary)}
              onClick={() => void onFinishOnboarding()}
            >
              <LayoutDashboard className="size-5" />
              <span>{finishing ? "Preparando tu panel…" : "Ir al panel"}</span>
              {!finishing ? <ArrowRight className="size-5" /> : null}
            </Button>
          </div>
        </motion.section>
      </div>
    );
  }

  return <OnboardingIntroModal businessName={businessName} />;
}
