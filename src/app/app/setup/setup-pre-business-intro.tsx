"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Boxes, Check, Package, QrCode, ReceiptText, ShoppingCart, Store, Wallet, Zap } from "lucide-react";

import { ONBOARDING_GUIDE_TIMELINE } from "@/app/app/(main)/onboarding/onboarding-guide-constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = { onContinue: () => void };

const benefits = [
  { label: "Fácil de usar", icon: Zap, tone: "text-cyan-300" },
  { label: "Control de stock", icon: Boxes, tone: "text-emerald-300" },
  { label: "Facturación ARCA", icon: ReceiptText, tone: "text-blue-300" },
  { label: "Cobro QR (MP)", icon: QrCode, tone: "text-fuchsia-300" },
] as const;

export function SetupPreBusinessIntro({ onContinue }: Props) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#06112f] text-white">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-24 size-[34rem] rounded-full bg-violet-600/25 blur-[110px]" />
        <div className="absolute right-[-10rem] top-[-10rem] size-[38rem] rounded-full bg-blue-500/20 blur-[130px]" />
        <div className="absolute bottom-[-16rem] left-1/3 size-[42rem] rounded-full bg-cyan-500/15 blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:42px_42px]" />
      </div>

      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="relative mx-auto flex min-h-dvh w-full max-w-[1500px] flex-col px-4 py-5 sm:px-7 lg:px-10 lg:py-7" role="dialog" aria-modal="true" aria-labelledby="setup-pre-onb-title">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_30px_rgba(34,211,238,.35)]"><ShoppingCart className="size-6" aria-hidden /></div>
            <div><div className="text-2xl font-black tracking-tight">Tienda<span className="text-cyan-300">360</span></div><div className="text-[11px] font-medium uppercase tracking-[0.22em] text-blue-200/70">Punto de venta</div></div>
          </div>

          <nav aria-label="Progreso de configuración" className="w-full lg:max-w-3xl">
            <ol className="grid grid-cols-4 gap-1.5 sm:gap-3">
              {ONBOARDING_GUIDE_TIMELINE.map((step, index) => {
                const Icon = step.id === "business" ? Store : step.id === "product" ? Package : step.id === "cash" ? Wallet : ShoppingCart;
                const current = index === 0;
                return <li key={step.id} className="relative flex min-w-0 flex-col items-center text-center">
                  {index > 0 ? <span aria-hidden className="absolute right-1/2 top-4 h-px w-full -translate-y-1/2 bg-white/25" /> : null}
                  <span className={cn("relative z-10 flex size-8 items-center justify-center rounded-full border text-xs font-black sm:size-10", current ? "border-cyan-200 bg-cyan-400 text-[#07142f] shadow-[0_0_22px_rgba(34,211,238,.8)]" : "border-white/50 bg-[#111d43] text-white/80")}>{current ? <Icon className="size-4 sm:size-5" /> : index + 1}</span>
                  <span className={cn("mt-2 truncate text-[10px] font-semibold sm:text-xs", current ? "text-white" : "text-blue-100/65")}>{step.label}</span>
                </li>;
              })}
            </ol>
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-7 py-7 lg:grid-cols-[0.78fr_1.22fr] lg:gap-10 lg:py-9">
          <section className="order-2 lg:order-1">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-200"><BadgeCheck className="size-4" /> Configuración guiada</p>
            <h2 className="mt-5 max-w-xl text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-5xl xl:text-6xl">Poné tu comercio en marcha en <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">minutos</span></h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-blue-100/75 sm:text-lg">Te acompañamos paso a paso para configurar Tienda360 y registrar tu primera venta sin perderte en el camino.</p>

            <div className="relative mt-7 hidden overflow-hidden rounded-[28px] border border-cyan-300/20 bg-black/20 shadow-[0_28px_75px_-35px_rgba(34,211,238,.65)] sm:block">
              <div className="relative aspect-[16/8.2]">
                <Image src="/banner/Tienda360_ Pantalla de ventas integral.png" alt="Pantalla de ventas de Tienda360" fill sizes="(min-width: 1024px) 38vw, 80vw" className="object-cover object-center" preload />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06112f]/45 via-transparent to-transparent" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {benefits.map(({ label, icon: Icon, tone }) => <div key={label} className="rounded-2xl border border-white/12 bg-white/[0.06] px-3 py-3 text-center backdrop-blur-sm"><Icon className={cn("mx-auto size-5", tone)} /><div className="mt-1.5 text-[11px] font-semibold text-blue-50/85">{label}</div></div>)}
            </div>
          </section>

          <motion.section initial={{ y: 18, opacity: 0, scale: 0.985 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ delay: 0.08, duration: 0.4 }} className="order-1 overflow-hidden rounded-[30px] border border-white/70 bg-white text-slate-900 shadow-[0_35px_100px_-30px_rgba(0,0,0,.65)] lg:order-2">
            <div className="p-5 sm:p-8 xl:p-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700"><span className="text-base">✦</span> Configuración inicial</div>
              <h1 id="setup-pre-onb-title" className="mt-4 text-3xl font-black tracking-[-0.035em] sm:text-4xl xl:text-5xl">Tu camino hasta la <span className="text-violet-600">primera venta</span></h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">Primero registramos los datos básicos de tu comercio. Después te guiamos dentro de las pantallas reales: producto → caja → venta.</p>

              <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1">
                {ONBOARDING_GUIDE_TIMELINE.map((step, index) => {
                  const Icon = step.id === "business" ? Store : step.id === "product" ? Package : step.id === "cash" ? Wallet : ShoppingCart;
                  return <React.Fragment key={step.id}>{index > 0 ? <ArrowRight className="size-4 shrink-0 text-slate-300" aria-hidden /> : null}<div className={cn("flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold sm:text-sm", index === 0 ? "border-blue-400 bg-blue-50 text-blue-700 shadow-sm" : "border-slate-200 bg-slate-50 text-slate-500")}><Icon className="size-4" /> {step.label}</div></React.Fragment>;
                })}
              </div>

              <div className="mt-6 rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50/70 p-5 sm:p-6">
                <div className="text-lg font-black">¿Qué vas a hacer?</div>
                <ul className="mt-3 grid gap-2.5 text-sm text-slate-700 sm:text-base">
                  {["Crear tu comercio con sus datos básicos.", "Cargar tu primer producto y stock.", "Abrir la caja para comenzar el turno.", "Registrar tu primera venta y completar la guía."].map((item) => <li key={item} className="flex items-start gap-2.5"><span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check className="size-3.5" /></span><span>{item}</span></li>)}
                </ul>
              </div>

              <Button type="button" onClick={onContinue} className="mt-6 h-14 w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 text-base font-black text-white shadow-[0_16px_36px_-14px_rgba(79,70,229,.8)] transition hover:brightness-110 sm:text-lg"><span className="inline-flex items-center gap-2">Siguiente: crear mi comercio <ArrowRight className="size-5" /></span></Button>
              <p className="mt-3 text-center text-xs text-slate-500">Podés completar la configuración a tu ritmo.</p>
            </div>
          </motion.section>
        </div>
      </motion.main>
    </div>
  );
}
