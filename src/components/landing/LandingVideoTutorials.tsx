"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, Play } from "lucide-react";

const tutorials = [
  ["Instalación del sistema", "Aprendé a descargar e instalar Tienda360 paso a paso.", "pLQDqRN0XpE"],
  ["Primer ingreso", "Aprendé a iniciar sesión y entrar al sistema.", "mEWPzS6RD70"],
  ["Creación de productos", "Creá productos, precios y categorías.", "xX_EWjoduZ0"],
  ["Caja diaria", "Abrí, controlá y cerrá la caja del día.", "jWTHrNC3TXU"],
  ["Ventas", "Registrá productos, cobrá y completá una venta paso a paso.", "_gnGrbQz5Dw"],
  ["Inventario", "Controlá existencias y movimientos de stock.", "f8qx4hahRh4"],
  ["Facturación electrónica", "Configurá y emití comprobantes electrónicos.", "eKf_n6Twk7c"],
  ["Etiquetas", "Diseñá e imprimí etiquetas para tus productos.", "TyNRPwxu6S0"],
  ["Estadísticas", "Interpretá las métricas principales de tu negocio.", "NYDewU_XjI8"],
  ["Configuración", "Personalizá Tienda360 para tu comercio.", "J8Cxgc_l-iY"],
  ["Clientes", "Registrá clientes y consultá su historial.", "h081Akg9lBc"],
  ["Reportes", "Consultá ventas y resultados con claridad.", "hsSXo-roQ5E"],
] as const;

export function LandingVideoTutorials() {
  const [showAll, setShowAll] = useState(false);
  const visibleTutorials = showAll ? tutorials : tutorials.slice(0, 3);

  return <section id="tutoriales" className="scroll-mt-24 bg-[#f6f4ec] py-20 text-[#0a2a1e] sm:py-24" aria-labelledby="tutoriales-heading">
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <div className="max-w-2xl"><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#2fa85a]">Tutoriales</p><h2 id="tutoriales-heading" className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Aprendé a tu ritmo</h2><p className="mt-4 leading-7 text-[#0a2a1e]/65">Videos cortos y claros para instalar, vender y administrar tu comercio con seguridad.</p></div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visibleTutorials.map(([title, description, id], index) => <article key={id} className="group overflow-hidden rounded-2xl bg-white shadow-[0_18px_40px_-28px_rgba(10,42,30,.5)] transition hover:-translate-y-1 hover:shadow-xl">
        <div className="relative aspect-video overflow-hidden bg-[#0a2a1e]"><iframe src={`https://www.youtube-nocookie.com/embed/${id}`} title={`Tutorial: ${title}`} loading="lazy" className="absolute inset-0 size-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /><span className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#ffb343] px-3 py-1 font-mono text-xs font-extrabold text-[#0a2a1e] shadow">{String(index + 1).padStart(2, "0")}</span></div>
        <div className="p-5"><h3 className="flex items-center gap-2 font-extrabold"><span className="grid size-8 place-items-center rounded-full bg-[#fce7c4] text-[#0a2a1e]"><Play className="size-3.5 fill-current" /></span>{title}</h3><p className="mt-3 text-sm leading-6 text-[#0a2a1e]/60">{description}</p><a href={`https://youtu.be/${id}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#2fa85a] hover:text-[#0a2a1e]">Abrir en YouTube <ExternalLink className="size-3.5" /></a></div>
      </article>)}</div>
      <div className="mt-8 text-center"><button type="button" onClick={() => setShowAll((value) => !value)} aria-expanded={showAll} className="inline-flex h-11 items-center justify-center rounded-full border-2 border-[#0a2a1e]/15 bg-transparent px-5 text-sm font-extrabold hover:border-[#0a2a1e]">{showAll ? "Ver menos tutoriales" : `Ver los ${tutorials.length} tutoriales`}<ChevronDown className={`ml-2 size-4 transition ${showAll ? "rotate-180" : ""}`} /></button></div>
    </div>
  </section>;
}
