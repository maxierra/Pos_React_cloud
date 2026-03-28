"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Layers, ShieldCheck, Sparkles, Zap } from "lucide-react";

import posHero from "@/pos.png";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 26, stiffness: 280 },
  },
};

const pills = [
  { icon: Zap, label: "Sin instalar nada" },
  { icon: ShieldCheck, label: "Datos en la nube" },
  { icon: BarChart3, label: "Ventas e informes" },
];

export function LandingHero() {
  return (
    <div className="relative">
      {/* Glow decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-1/4 top-0 h-[420px] w-[420px] rounded-full bg-fuchsia-500/25 blur-[100px] md:h-[520px] md:w-[520px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-1/4 top-24 h-[360px] w-[360px] rounded-full bg-cyan-400/20 blur-[90px] md:top-12"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-40 h-[200px] w-[80%] max-w-3xl -translate-x-1/2 rounded-full bg-violet-500/15 blur-[80px]"
      />

      <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
        <motion.div
          variants={container}
          initial={false}
          animate="show"
          className="text-center lg:text-left"
        >
          <motion.div variants={item} initial={false} className="flex justify-center lg:justify-start">
            <span className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/20 bg-white/[0.07] px-4 py-1.5 text-[0.8125rem] font-semibold leading-snug text-cyan-100 shadow-[0_0_40px_-8px_rgba(34,211,238,0.45)] backdrop-blur-md sm:text-sm">
              <span className="absolute inset-0 -translate-x-full animate-[posShimmer_2.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/12 to-transparent" />
              <Sparkles className="relative size-3.5 text-cyan-300" />
              <span className="relative">POS moderno para comercios en Argentina</span>
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            initial={false}
            className="mx-auto mt-5 max-w-4xl text-balance font-serif font-bold tracking-tight text-white lg:mx-0 lg:max-w-none"
          >
            <span className="block text-[1.75rem] leading-[1.12] sm:text-4xl sm:leading-tight md:text-[2.5rem] md:leading-[1.1] lg:text-5xl lg:leading-[1.08] xl:text-6xl xl:leading-[1.05]">
              Cobrá más rápido.
            </span>
            <span className="mt-1.5 block bg-gradient-to-r from-fuchsia-300 via-violet-200 to-cyan-300 bg-clip-text text-[1.75rem] text-transparent leading-[1.12] sm:text-4xl sm:leading-tight md:text-[2.5rem] md:leading-[1.1] lg:text-5xl lg:leading-[1.08] xl:text-6xl xl:leading-[1.05]">
              Controlá tu negocio en vivo.
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            initial={false}
            className="mx-auto mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-white/85 md:text-lg md:leading-relaxed lg:mx-0 lg:mt-6"
          >
            Stock, caja, tickets e informes en un solo sistema. Más abajo, una{" "}
            <strong className="text-white">demo en vivo</strong> te muestra el flujo completo de una venta, como en el
            mostrador.
          </motion.p>

          <motion.div
            variants={item}
            initial={false}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 lg:justify-start"
          >
            <Link
              href="/auth/register"
              className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-8 text-sm font-bold text-white shadow-[0_0_40px_-6px_rgba(217,70,239,0.65)] transition hover:scale-[1.02] hover:shadow-[0_0_50px_-4px_rgba(34,211,238,0.5)] active:scale-[0.98]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition group-hover:translate-x-full group-hover:opacity-100 group-hover:duration-700" />
              <span className="relative">Empezar gratis</span>
              <ArrowRight className="relative size-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/25 bg-white/5 px-7 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/10"
            >
              Ya tengo cuenta
            </Link>
          </motion.div>

          <motion.div
            variants={item}
            initial={false}
            className="mt-10 flex flex-wrap items-center justify-center gap-2 md:gap-3 lg:justify-start"
          >
            {pills.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-medium text-white/85 backdrop-blur-md md:text-sm"
              >
                <Icon className="size-4 shrink-0 text-cyan-300/90" />
                {label}
              </span>
            ))}
          </motion.div>

          <motion.div
            variants={item}
            initial={false}
            className="mx-auto mt-12 flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-3 border-y border-white/10 py-6 text-sm text-white/55 lg:mx-0 lg:justify-start"
          >
            <span className="inline-flex items-center gap-2">
              <Layers className="size-4 text-fuchsia-300/80" />
              Multi-rubro: kiosco, almacén, retail
            </span>
            <span className="hidden h-4 w-px bg-white/20 sm:block" aria-hidden />
            <span>Prueba incluida · sin tarjeta para registrarte</span>
          </motion.div>
        </motion.div>

        <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 scale-110 rounded-3xl bg-gradient-to-br from-fuchsia-500/20 via-violet-500/15 to-cyan-500/20 blur-3xl"
          />
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-2 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.5)] backdrop-blur-sm">
            <Image
              src={posHero}
              alt="Interfaz del punto de venta: caja, productos e informes"
              className="h-auto w-full rounded-xl"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              placeholder="blur"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
