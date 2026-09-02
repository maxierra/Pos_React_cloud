import Link from "next/link";
import { BarChart3, Barcode, Boxes, Download, Headphones, LogIn, PackageCheck, ReceiptText, Settings2, ShoppingCart, Users } from "lucide-react";

import { MetaPixel } from "@/components/analytics/meta-pixel";
import { MetaTrackedLink } from "@/components/analytics/meta-tracked-link";
import { LandingVideoTutorials } from "@/components/landing/LandingVideoTutorials";
import { LandingDownloadButton } from "@/components/landing/landing-download-button";
import { formatStorePrice } from "@/lib/store-products";

const features = [
  [ShoppingCart, "Ventas rápidas", "Registrá ventas y cobrá en segundos desde una pantalla simple."],
  [Boxes, "Stock bajo control", "Conocé existencias, movimientos y productos que necesitan reposición."],
  [BarChart3, "Reportes claros", "Entendé ventas, ganancias y productos destacados sin planillas."],
  [Users, "Clientes y cuentas", "Guardá datos, consultá historiales y administrá cuentas corrientes."],
  [ReceiptText, "Facturación ARCA", "Emití comprobantes electrónicos con la integración lista."],
  [Barcode, "Etiquetas y códigos", "Creá e imprimí etiquetas para ordenar todo tu catálogo."],
] as const;

const steps = [
  ["01", "Descargalo gratis", "Instalalo en tu PC en minutos. No pedimos tarjeta ni compromiso de compra."],
  ["02", "Usalo con tus ventas reales", "Probá durante 3 días el sistema completo: ventas, stock, caja y reportes."],
  ["03", "Activá tu licencia", "Pagás una sola vez y seguís exactamente donde lo dejaste. Nada se pierde."],
] as const;

const whatsappPurchaseUrl = "https://wa.me/5491123145742?text=Hola%2C%20quiero%20comprar%20la%20licencia%20definitiva%20de%20Tienda360%20por%20%2435.000";

export default async function Home({ searchParams }: { searchParams?: Promise<{ missingSupabase?: string }> }) {
  const sp = (await searchParams) ?? {};
  const softwarePrice = 35_000;

  return <main className="overflow-hidden bg-[#f6f4ec] text-[#0a2a1e]">
    <MetaPixel value={softwarePrice} contentName="Software POS Tienda360" contentId="software_lifetime" />
    {sp.missingSupabase ? <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm">La recepción de pedidos está momentáneamente en mantenimiento.</div> : null}

    <header className="sticky top-0 z-50 bg-[#0a2a1e]/95 text-[#f6f4ec] backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href="#inicio" aria-label="Ir al inicio de Tienda360" className="flex items-center gap-2.5 font-black"><span className="grid size-9 place-items-center rounded-lg bg-[#ffb343] font-mono text-[10px] text-[#0a2a1e]">360</span><span className="text-lg">Tienda360</span></a>
        <nav aria-label="Navegación principal" className="hidden items-center gap-7 text-sm font-semibold text-[#f6f4ec]/70 md:flex"><a href="#como-funciona" className="transition hover:text-[#ffb343]">Cómo funciona</a><a href="#funciones" className="transition hover:text-[#ffb343]">Funciones</a><a href="#precio" className="transition hover:text-[#ffb343]">Precio</a><a href="#tutoriales" className="transition hover:text-[#ffb343]">Tutoriales</a></nav>
        <div className="flex items-center gap-3"><Link href="/auth/login" className="hidden items-center text-sm font-bold text-[#f6f4ec]/70 hover:text-white sm:inline-flex"><LogIn className="mr-2 size-4" />Ingresar</Link><LandingDownloadButton source="landing_header" ariaLabel="Descargar prueba gratis de Tienda360 por 3 días" className="inline-flex h-10 items-center rounded-full bg-[#ffb343] px-4 text-sm font-extrabold text-[#0a2a1e] transition hover:-translate-y-0.5 hover:bg-[#ffc164]"><Download className="mr-2 size-4" />Prueba gratis</LandingDownloadButton></div>
      </div>
    </header>

    <div className="overflow-hidden border-y-2 border-[#0a2a1e] bg-[#ffb343] py-2.5 font-mono text-xs font-bold sm:text-sm" aria-hidden="true"><div className="tienda-marquee flex w-max gap-6 whitespace-nowrap">{[0, 1].map((copy) => <div key={copy} className="flex gap-6"><span>DESCARGALO GRATIS</span><span>●</span><span>PROBALO 3 DÍAS</span><span>●</span><span>PAGO ÚNICO $35.000</span><span>●</span><span>SIN SUSCRIPCIONES</span><span>●</span></div>)}</div></div>

    <section id="inicio" className="relative scroll-mt-20 bg-[#0a2a1e] pb-24 pt-20 text-[#f6f4ec] sm:pb-28 sm:pt-24">
      <div className="absolute -right-40 top-0 size-[32rem] rounded-full bg-[#2fa85a]/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.12fr_.88fr]">
        <div><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#ffb343]">Punto de venta para Windows</p><h1 className="mt-5 max-w-3xl text-5xl font-black leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-7xl">Probá tu punto de venta <span className="text-[#ffb343]">antes</span> de pagarlo.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-[#f6f4ec]/70">Descargá Tienda360 y usalo 3 días completos con tus ventas reales. Si te sirve, activás tu licencia por $35.000, pago único, y seguís exactamente donde lo dejaste.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><LandingDownloadButton source="landing_hero" ariaLabel="Descargar prueba gratis de Tienda360 por 3 días" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#ffb343] px-6 py-3 text-sm font-extrabold text-[#0a2a1e] shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#ffc164]"><Download className="mr-2 size-4" />Descargar Prueba Gratis (3 Días)</LandingDownloadButton><a href="#tutoriales" aria-label="Ver los tutoriales de Tienda360" className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-[#f6f4ec]/20 px-6 py-3 text-sm font-extrabold transition hover:border-[#f6f4ec]">Ver cómo funciona</a></div>
          <p className="mt-5 font-mono text-xs text-[#f6f4ec]/55">✓ Instalación en 2 minutos &nbsp; ✓ Sin tarjeta &nbsp; ✓ Sin compromiso de compra</p>
        </div>
        <aside className="mx-auto w-full max-w-md -rotate-2 rounded-3xl bg-[#f6f4ec] p-7 text-[#0a2a1e] shadow-2xl shadow-black/40 sm:p-9" aria-label="Resumen de licencia Tienda360"><p className="font-mono text-xs font-bold text-[#2fa85a]">LICENCIA TIENDA360</p><p className="mt-2 text-5xl font-black tracking-tight sm:text-6xl">{formatStorePrice(softwarePrice)}<sup className="ml-2 text-base">ARS</sup></p><p className="mt-2 text-sm text-[#0a2a1e]/60">Pago único · sin mensualidades</p><div className="my-6 border-t-2 border-dashed border-[#0a2a1e]/15" /><ul className="space-y-3 text-sm font-semibold">{["Ventas, stock, clientes y caja", "Facturación electrónica ARCA", "Productos y reportes sin límite"].map((item) => <li key={item} className="flex gap-3"><span className="grid size-5 shrink-0 place-items-center rounded bg-[#fce7c4] text-xs font-black">✓</span>{item}</li>)}</ul></aside>
      </div>
    </section>

    <section id="como-funciona" className="scroll-mt-20 py-20 sm:py-24"><div className="mx-auto max-w-6xl px-5 sm:px-8"><div className="max-w-2xl"><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#2fa85a]">Cómo funciona</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">La prueba, sin letra chica</h2><p className="mt-4 text-lg text-[#0a2a1e]/65">Es el sistema completo funcionando con tu comercio real durante 3 días.</p></div><div className="mt-10 grid gap-4 lg:grid-cols-3">{steps.map(([number, title, description], index) => <article key={number} className={`relative min-h-56 overflow-hidden rounded-2xl p-7 ${index === 0 ? "bg-[#0a2a1e] text-[#f6f4ec]" : index === 1 ? "bg-[#2fa85a] text-white" : "bg-[#ffb343] text-[#0a2a1e]"}`}><span className="absolute -right-1 -top-5 font-mono text-8xl font-black opacity-15">{number}</span><h3 className="relative mt-16 text-xl font-extrabold">{title}</h3><p className="relative mt-3 text-sm leading-6 opacity-80">{description}</p></article>)}</div></div></section>

    <section id="funciones" className="scroll-mt-20 pb-20 sm:pb-24"><div className="mx-auto max-w-6xl px-5 sm:px-8"><div className="max-w-2xl"><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#2fa85a]">Funciones</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Todo lo que necesitás para vender mejor</h2><p className="mt-4 text-[#0a2a1e]/65">Pensado para kioscos, almacenes, autoservicios y comercios de indumentaria.</p></div><div className="mt-10 grid overflow-hidden rounded-2xl border border-[#0a2a1e]/10 bg-[#0a2a1e]/10 sm:grid-cols-2 lg:grid-cols-3">{features.map(([Icon, title, text], index) => <article key={title} className="bg-white p-7 transition hover:bg-[#fce7c4]"><span className="grid size-10 place-items-center rounded-lg bg-[#0a2a1e] text-[#ffb343]"><Icon className="size-5" /></span><p className="mt-5 font-mono text-xs font-bold text-[#2fa85a]">{String(index + 1).padStart(2, "0")}</p><h3 className="mt-2 text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#0a2a1e]/60">{text}</p></article>)}</div></div></section>

    <section id="precio" className="scroll-mt-20 bg-[#0a2a1e] py-20 text-[#f6f4ec] sm:py-24"><div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2"><div><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#ffb343]">Precio</p><h2 className="mt-3 text-4xl font-black leading-tight tracking-tight sm:text-5xl">Pagás una vez.<br />Es tuyo para siempre.</h2><p className="mt-5 max-w-lg text-lg leading-8 text-[#f6f4ec]/65">Sin planes mensuales, renovaciones automáticas ni costos ocultos. Probalo gratis y activalo cuando estés listo.</p><p className="mt-7 inline-flex rounded-xl border border-[#ffb343]/35 bg-[#ffb343]/10 px-4 py-3 text-sm font-bold text-[#ffb343]">Sin cuotas mensuales ni renovaciones automáticas.</p></div>
      <article className="pricing-card rounded-3xl bg-[#ffb343] p-7 text-[#0a2a1e] sm:p-10"><p className="font-mono text-xs font-bold">LICENCIA DEFINITIVA · PAGO ÚNICO</p><p className="mt-3 text-5xl font-black tracking-tight sm:text-7xl">{formatStorePrice(softwarePrice)}<span className="ml-2 text-lg">ARS</span></p><p className="mt-2 text-sm opacity-70">Una licencia, sin suscripciones</p><div className="my-6 border-t-2 border-dashed border-[#0a2a1e]/25" /><ul className="grid gap-3 text-sm font-semibold sm:grid-cols-2">{["Ventas sin interrupciones", "Todos los reportes", "Productos y clientes sin límite", "Soporte y actualizaciones"].map((item) => <li key={item} className="flex gap-2"><span className="font-black">✓</span>{item}</li>)}</ul><p className="mt-6 text-sm font-bold">Efectivo, Transferencia, Tarjeta y 3 Cuotas Sin Interés</p><MetaTrackedLink event="ClickWhatsApp" href={whatsappPurchaseUrl} aria-label="Comprar licencia definitiva de Tienda360 por 35.000 pesos mediante WhatsApp" className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#0a2a1e] px-5 py-3 text-center text-sm font-extrabold text-[#f6f4ec] transition hover:bg-[#0f3a2a]">Comprar Licencia Definitiva ($35.000)</MetaTrackedLink><p className="mt-3 text-center text-xs opacity-65">Compra asistida y activación por WhatsApp.</p></article>
    </div></section>

    <LandingVideoTutorials />

    <section className="border-y border-[#0a2a1e]/10 bg-white py-12"><div className="mx-auto grid max-w-6xl gap-7 px-5 sm:grid-cols-3 sm:px-8">{[[PackageCheck, "Tus datos protegidos", "La activación conserva toda tu información."], [Headphones, "Soporte permanente", "Te acompañamos cuando lo necesites."], [Settings2, "Capacitación incluida", "Aprendé desde cero con nuestros videos."]].map(([Icon, title, text]) => { const TrustIcon = Icon as typeof PackageCheck; return <div key={String(title)} className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#fce7c4] text-[#0a2a1e]"><TrustIcon className="size-5" /></span><div><h3 className="font-extrabold">{String(title)}</h3><p className="mt-1 text-sm text-[#0a2a1e]/60">{String(text)}</p></div></div>; })}</div></section>

    <section id="descargar" className="py-20 sm:py-24"><div className="mx-auto max-w-6xl px-5 sm:px-8"><div className="flex flex-col gap-8 rounded-3xl bg-[#ffb343] p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="max-w-xl text-3xl font-black tracking-tight sm:text-4xl">Empezá a vender en menos de 5 minutos</h2><p className="mt-3 max-w-xl text-[#0a2a1e]/70">Descargalo gratis, probalo 3 días con tu comercio real y decidí después.</p></div><div className="flex shrink-0 flex-col gap-3 sm:flex-row"><LandingDownloadButton source="landing_final" ariaLabel="Descargar prueba gratis de Tienda360 para Windows" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#0a2a1e] px-6 py-3 text-sm font-extrabold text-[#f6f4ec] transition hover:bg-[#0f3a2a]"><Download className="mr-2 size-4" />Descargar gratis</LandingDownloadButton><MetaTrackedLink event="ClickWhatsApp" href="https://wa.me/5491123145742" aria-label="Consultar sobre Tienda360 por WhatsApp" className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-[#0a2a1e]/20 px-6 py-3 text-sm font-extrabold transition hover:border-[#0a2a1e]">Hablar por WhatsApp</MetaTrackedLink></div></div></div></section>

    <footer className="bg-[#0a2a1e] text-[#f6f4ec]/65"><div className="mx-auto max-w-6xl px-5 py-10 sm:px-8"><div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 font-black text-[#f6f4ec]"><span className="grid size-8 place-items-center rounded-lg bg-[#ffb343] font-mono text-[9px] text-[#0a2a1e]">360</span>Tienda360</p><div className="flex flex-wrap gap-5 text-sm"><a href="#funciones">Funciones</a><a href="#como-funciona">Cómo funciona</a><a href="#precio">Precio</a><a href="#tutoriales">Tutoriales</a><Link href="/pedido">Seguir pedido</Link></div></div><div className="mt-8 flex flex-col gap-2 border-t border-[#f6f4ec]/15 pt-5 text-xs sm:flex-row sm:justify-between"><span>© 2026 Tienda360. Todos los derechos reservados.</span><span>Tus datos siempre seguros. Nada se borra, nada se pierde.</span></div></div></footer>
  </main>;
}
