import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

import comboComercio from "@/combo comercio.png";
import comboInicial from "@/comboinicial.png";
import { cn } from "@/lib/utils";

const COMBO_FULL_SPECS = [
  "PC Intel Core i5",
  "8 GB RAM",
  "Teclado y mouse",
  'Monitor 22"',
  "Lector de código de barras",
  "Impresora térmica de tickets",
];

function moneyAr(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function LandingCombos() {
  return (
    <section id="combos" className="relative mt-16 scroll-mt-24 md:mt-20" aria-labelledby="combos-heading">
      <div className="mb-10 text-center">
        <h2
          id="combos-heading"
          className="font-serif text-2xl font-bold tracking-tight text-white md:text-4xl"
        >
          Combos de{" "}
          <span className="bg-gradient-to-r from-amber-200 via-white to-cyan-200 bg-clip-text text-transparent">
            hardware listo para tu mostrador
          </span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/65 md:text-base">
          Equipamiento pensado para acompañar el POS: armá tu caja con todo lo necesario o empezá con un pack
          inicial accesible.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <article
          className={cn(
            "flex flex-col overflow-hidden rounded-2xl border border-amber-400/25 bg-gradient-to-b from-amber-500/10 to-white/[0.03] shadow-lg shadow-amber-900/20 backdrop-blur-sm"
          )}
        >
          <div className="relative aspect-[4/3] w-full bg-black/20">
            <Image
              src={comboComercio}
              alt="Combo comercio: PC, monitor, lector e impresora térmica para punto de venta"
              className="object-contain p-4"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={false}
            />
          </div>
          <div className="flex flex-1 flex-col border-t border-white/10 p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xl font-bold text-white md:text-2xl">Combo comercio</h3>
              <p className="font-serif text-2xl font-bold text-amber-200 md:text-3xl">
                {moneyAr(700_000)}
              </p>
            </div>
            <p className="mt-2 text-sm text-white/60">
              Estación completa para vender con comodidad: PC, monitor, periféricos y equipamiento de caja
              profesional.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-white/85">
              {COMBO_FULL_SPECS.map((line) => (
                <li key={line} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <Link
              href="#contacto"
              className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/15 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/25"
            >
              Consultar por este combo
            </Link>
          </div>
        </article>

        <article
          className={cn(
            "flex flex-col overflow-hidden rounded-2xl border border-cyan-400/25 bg-gradient-to-b from-cyan-500/10 to-white/[0.03] shadow-lg shadow-cyan-900/20 backdrop-blur-sm"
          )}
        >
          <div className="relative aspect-[4/3] w-full bg-black/20">
            <Image
              src={comboInicial}
              alt="Combo inicial para punto de venta"
              className="object-contain p-4"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="flex flex-1 flex-col border-t border-white/10 p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xl font-bold text-white md:text-2xl">Combo inicial</h3>
              <p className="font-serif text-2xl font-bold text-cyan-200 md:text-3xl">{moneyAr(100_000)}</p>
            </div>
            <p className="mt-2 text-sm text-white/60">
              Ideal para quien quiere arrancar con una inversión acotada. Consultanos el contenido exacto del
              pack según stock y tu tipo de negocio.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-white/85">
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-cyan-400" aria-hidden />
                <span>Entrada económica al ecosistema POS</span>
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-cyan-400" aria-hidden />
                <span>Asesoramiento según lo que necesites en el mostrador</span>
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-cyan-400" aria-hidden />
                <span>Valores y equipos sujetos a disponibilidad</span>
              </li>
            </ul>
            <Link
              href="#contacto"
              className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/15 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25"
            >
              Consultar combo inicial
            </Link>
          </div>
        </article>
      </div>

      <p className="mt-6 text-center text-xs text-white/45">
        Precios expresados en pesos argentinos, referenciales. No incluyen software ni suscripción. Consultá
        formas de pago y entrega por WhatsApp o mail.
      </p>
    </section>
  );
}
