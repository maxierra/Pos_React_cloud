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

const frequentlyAskedQuestions = [
  ["¿Tienda360 funciona en el celular?", "No. Tienda360 es un punto de venta para PC con Windows. Podés visitar esta página o dejarnos tus datos desde el celular, pero la descarga y la instalación deben hacerse en tu computadora."],
  ["¿El precio es realmente un solo pago?", "Sí. Pagás $35.000 una sola vez y obtenés la licencia definitiva. No hay abonos, suscripciones ni renovaciones mensuales."],
  ["¿Tengo que cargar todos mis productos antes de vender?", "No. Con Carga Rápida podés completar los datos mínimos de un producto durante la venta. Vendés en el momento y el producto queda guardado para la próxima vez."],
  ["¿Qué pasa con los datos cargados durante la prueba?", "Quedan guardados. Cuando activás la licencia continuás exactamente donde terminaste, con tus productos, ventas y configuraciones."],
  ["¿Cómo solicito ayuda?", "Podés contactar a nuestro soporte técnico por WhatsApp, de 10 a 18 h. Te ayudamos con la instalación y el uso del sistema."],
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
        <nav aria-label="Navegación principal" className="hidden items-center gap-7 text-sm font-semibold text-[#f6f4ec]/70 md:flex"><a href="#como-funciona" className="transition hover:text-[#ffb343]">Cómo funciona</a><a href="#carga-rapida" className="transition hover:text-[#ffb343]">Carga rápida</a><a href="#funciones" className="transition hover:text-[#ffb343]">Funciones</a><a href="#precio" className="transition hover:text-[#ffb343]">Precio</a><a href="#tutoriales" className="transition hover:text-[#ffb343]">Tutoriales</a></nav>
        <div className="flex items-center gap-3"><Link href="/auth/login" className="hidden items-center text-sm font-bold text-[#f6f4ec]/70 hover:text-white sm:inline-flex"><LogIn className="mr-2 size-4" />Ingresar</Link><LandingDownloadButton source="landing_header" ariaLabel="Descargar prueba gratis de Tienda360 por 3 días" className="inline-flex h-10 items-center rounded-full bg-[#ffb343] px-4 text-sm font-extrabold text-[#0a2a1e] transition hover:-translate-y-0.5 hover:bg-[#ffc164]"><Download className="mr-2 size-4" />Prueba gratis</LandingDownloadButton></div>
      </div>
    </header>

    <div className="overflow-hidden border-y-2 border-[#0a2a1e] bg-[#ffb343] py-2.5 font-mono text-xs font-bold sm:text-sm" aria-label="Promoción: licencia definitiva por un único pago de 35.000 pesos, sin suscripciones"><div className="tienda-marquee flex w-max gap-6 whitespace-nowrap">{[0, 1].map((copy) => <div key={copy} className="flex gap-6"><span>OFERTA PAGO ÚNICO: $35.000</span><span>●</span><span>LA LICENCIA ES TUYA PARA SIEMPRE</span><span>●</span><span>SIN CUOTAS MENSUALES</span><span>●</span><span>PROBALO GRATIS 3 DÍAS</span><span>●</span></div>)}</div></div>

    <section id="inicio" className="relative scroll-mt-20 bg-[#0a2a1e] pb-24 pt-20 text-[#f6f4ec] sm:pb-28 sm:pt-24">
      <div className="absolute -right-40 top-0 size-[32rem] rounded-full bg-[#2fa85a]/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.12fr_.88fr]">
        <div><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#ffb343]">Punto de venta para Windows</p><h1 className="mt-5 max-w-3xl text-5xl font-black leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-7xl">Probá tu punto de venta <span className="text-[#ffb343]">antes</span> de pagarlo.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-[#f6f4ec]/70">Descargá Tienda360 y usalo 3 días completos con tus ventas reales. Si te sirve, activás tu licencia por $35.000, pago único, y seguís exactamente donde lo dejaste.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><LandingDownloadButton source="landing_hero" ariaLabel="Descargar prueba gratis de Tienda360 por 3 días" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#ffb343] px-6 py-3 text-sm font-extrabold text-[#0a2a1e] shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#ffc164]"><Download className="mr-2 size-4" />Descargar Prueba Gratis (3 Días)</LandingDownloadButton><a href="#tutoriales" aria-label="Ver los tutoriales de Tienda360" className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-[#f6f4ec]/20 px-6 py-3 text-sm font-extrabold transition hover:border-[#f6f4ec]">Ver cómo funciona</a></div>
          <p className="mt-5 font-mono text-xs text-[#f6f4ec]/55">✓ Instalación en 2 minutos &nbsp; ✓ Sin tarjeta &nbsp; ✓ Sin compromiso de compra</p>
        </div>
        <aside className="mx-auto w-full max-w-md -rotate-2 rounded-3xl bg-[#f6f4ec] p-7 text-[#0a2a1e] shadow-2xl shadow-black/40 sm:p-9" aria-label="Resumen de licencia Tienda360"><p className="inline-flex rounded-full bg-[#ffb343] px-3 py-1 font-mono text-xs font-black">OFERTA · PAGO ÚNICO</p><p className="mt-3 text-5xl font-black tracking-tight sm:text-6xl">{formatStorePrice(softwarePrice)}<sup className="ml-2 text-base">ARS</sup></p><p className="mt-2 text-base font-extrabold">Pagás una sola vez. La licencia es tuya para siempre.</p><p className="mt-1 text-sm text-[#0a2a1e]/60">Sin abonos ni cuotas mensuales.</p><div className="my-6 border-t-2 border-dashed border-[#0a2a1e]/15" /><ul className="space-y-3 text-sm font-semibold">{["Ventas, stock, clientes y caja", "Facturación electrónica ARCA", "Productos y reportes sin límite"].map((item) => <li key={item} className="flex gap-3"><span className="grid size-5 shrink-0 place-items-center rounded bg-[#fce7c4] text-xs font-black">✓</span>{item}</li>)}</ul></aside>
      </div>
    </section>

    <section id="como-funciona" className="scroll-mt-20 py-20 sm:py-24"><div className="mx-auto max-w-6xl px-5 sm:px-8"><div className="max-w-2xl"><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#2fa85a]">Cómo funciona</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">La prueba, sin letra chica</h2><p className="mt-4 text-lg text-[#0a2a1e]/65">Es el sistema completo funcionando con tu comercio real durante 3 días.</p></div><div className="mt-10 grid gap-4 lg:grid-cols-3">{steps.map(([number, title, description], index) => <article key={number} className={`relative min-h-56 overflow-hidden rounded-2xl p-7 ${index === 0 ? "bg-[#0a2a1e] text-[#f6f4ec]" : index === 1 ? "bg-[#2fa85a] text-white" : "bg-[#ffb343] text-[#0a2a1e]"}`}><span className="absolute -right-1 -top-5 font-mono text-8xl font-black opacity-15">{number}</span><h3 className="relative mt-16 text-xl font-extrabold">{title}</h3><p className="relative mt-3 text-sm leading-6 opacity-80">{description}</p></article>)}</div></div></section>

    <section id="carga-rapida" className="scroll-mt-20 bg-[#0a2a1e] py-20 text-[#f6f4ec] sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:gap-16">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#ffb343]">Carga rápida</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl">Mientras tus clientes compran, tu catálogo se completa.</h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#f6f4ec]/75">Cuando llega a la caja un producto que todavía no cargaste, la <strong className="text-[#f6f4ec]">Carga Rápida</strong> te permite completar lo mínimo, venderlo y guardarlo en segundos, sin frenar la venta.</p>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#f6f4ec]/75">Tus clientes van marcando qué productos cargar primero. Así, incorporás los artículos que realmente se venden, sin pasar jornadas enteras preparando el inventario.</p>
          <p className="mt-7 text-xl font-black text-[#ffb343]">Cargás lo que se vende. Nada más.</p>
        </div>

        <aside className="rounded-3xl border border-[#ffb343]/25 bg-[#153f31] p-6 shadow-2xl shadow-black/20 sm:p-8" aria-label="Ejemplo de carga rápida durante una venta">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-[#f6f4ec]/80">Caja — venta en curso</p>
            <span className="shrink-0 rounded-full bg-[#ffb343] px-3 py-1 font-mono text-xs font-bold text-[#0a2a1e]">Producto nuevo</span>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-4 rounded-xl border border-dashed border-[#ffb343]/55 bg-[#f6f4ec]/5 p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#ffb343] text-xl" aria-hidden="true">🧴</span>
              <div><p className="font-extrabold">Shampoo 400 ml</p><p className="mt-0.5 text-sm text-[#f6f4ec]/75">Cargando con Carga Rápida…</p></div>
            </div>
            {[["🥤", "Gaseosa 1,5 l"], ["🍫", "Chocolate 100 g"]].map(([icon, product]) => <div key={product} className="flex items-center gap-4 rounded-xl border border-[#f6f4ec]/10 bg-[#f6f4ec]/5 p-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f6f4ec]/10 text-xl" aria-hidden="true">{icon}</span><div><p className="font-bold text-[#f6f4ec]/80">{product}</p><p className="mt-0.5 text-sm text-[#f6f4ec]/55">Ya está en tu inventario</p></div></div>)}
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-[#f6f4ec]/15 pt-5 text-sm"><span className="text-[#f6f4ec]/75">Productos cargados hoy</span><strong className="font-mono text-[#ffb343]">+7</strong></div>
        </aside>
      </div>
    </section>

    <section id="funciones" className="scroll-mt-20 pb-20 sm:pb-24"><div className="mx-auto max-w-6xl px-5 sm:px-8"><div className="max-w-2xl"><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#2fa85a]">Funciones</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Todo lo que necesitás para vender mejor</h2><p className="mt-4 text-[#0a2a1e]/65">Pensado para kioscos, almacenes, autoservicios y comercios de indumentaria.</p></div><div className="mt-10 grid overflow-hidden rounded-2xl border border-[#0a2a1e]/10 bg-[#0a2a1e]/10 sm:grid-cols-2 lg:grid-cols-3">{features.map(([Icon, title, text], index) => <article key={title} className="bg-white p-7 transition hover:bg-[#fce7c4]"><span className="grid size-10 place-items-center rounded-lg bg-[#0a2a1e] text-[#ffb343]"><Icon className="size-5" /></span><p className="mt-5 font-mono text-xs font-bold text-[#2fa85a]">{String(index + 1).padStart(2, "0")}</p><h3 className="mt-2 text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#0a2a1e]/60">{text}</p></article>)}</div></div></section>

    <section id="precio" className="scroll-mt-20 bg-[#0a2a1e] py-20 text-[#f6f4ec] sm:py-24"><div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2"><div><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#ffb343]">Precio</p><h2 className="mt-3 text-4xl font-black leading-tight tracking-tight sm:text-5xl">Pagás una vez.<br />Es tuyo para siempre.</h2><p className="mt-5 max-w-lg text-lg leading-8 text-[#f6f4ec]/65">Sin planes mensuales, renovaciones automáticas ni costos ocultos. Probalo gratis y activalo cuando estés listo.</p><p className="mt-7 inline-flex rounded-xl border border-[#ffb343]/35 bg-[#ffb343]/10 px-4 py-3 text-sm font-bold text-[#ffb343]">Sin cuotas mensuales ni renovaciones automáticas.</p></div>
      <article className="pricing-card rounded-3xl bg-[#ffb343] p-7 text-[#0a2a1e] sm:p-10"><p className="font-mono text-xs font-bold">LICENCIA DEFINITIVA · PAGO ÚNICO</p><p className="mt-3 text-5xl font-black tracking-tight sm:text-7xl">{formatStorePrice(softwarePrice)}<span className="ml-2 text-lg">ARS</span></p><p className="mt-2 text-sm opacity-70">Una licencia, sin suscripciones</p><div className="my-6 border-t-2 border-dashed border-[#0a2a1e]/25" /><ul className="grid gap-3 text-sm font-semibold sm:grid-cols-2">{["Ventas sin interrupciones", "Todos los reportes", "Productos y clientes sin límite", "Soporte y actualizaciones"].map((item) => <li key={item} className="flex gap-2"><span className="font-black">✓</span>{item}</li>)}</ul><p className="mt-6 text-sm font-bold">Efectivo, Transferencia, Tarjeta y 3 Cuotas Sin Interés</p><MetaTrackedLink event="ClickWhatsApp" href={whatsappPurchaseUrl} aria-label="Comprar licencia definitiva de Tienda360 por 35.000 pesos mediante WhatsApp" className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#0a2a1e] px-5 py-3 text-center text-sm font-extrabold text-[#f6f4ec] transition hover:bg-[#0f3a2a]">Comprar Licencia Definitiva ($35.000)</MetaTrackedLink><p className="mt-3 text-center text-xs opacity-65">Compra asistida y activación por WhatsApp.</p></article>
    </div></section>

    <LandingVideoTutorials />

    <section id="nosotros" className="scroll-mt-20 bg-[#fce7c4] py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
        <div><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#187b43]">Sobre nosotros</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Tecnología pensada para el comercio real.</h2></div>
        <div className="space-y-5 text-lg leading-8 text-[#0a2a1e]/75"><p>Tienda360 fue creado para que kioscos, almacenes, autoservicios y otros comercios puedan ordenar sus ventas sin procesos complicados ni costos mensuales.</p><p>Diseñamos cada función pensando en el trabajo cotidiano detrás del mostrador: empezar rápido, cobrar sin demoras, controlar el negocio con claridad y contar con ayuda cuando haga falta.</p><p className="font-extrabold text-[#0a2a1e]">Un sistema simple, una licencia para siempre y soporte de personas reales.</p></div>
      </div>
    </section>

    <section id="preguntas" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="text-center"><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#187b43]">Preguntas frecuentes</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Todo claro antes de empezar</h2></div>
        <div className="mt-10 divide-y divide-[#0a2a1e]/10 border-y border-[#0a2a1e]/10">{frequentlyAskedQuestions.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-extrabold"><span>{question}</span><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#ffb343] text-xl transition group-open:rotate-45" aria-hidden="true">+</span></summary><p className="max-w-3xl pr-12 pt-3 leading-7 text-[#0a2a1e]/65">{answer}</p></details>)}</div>
        <div className="mt-8 text-center"><p className="text-sm text-[#0a2a1e]/65">¿Te quedó alguna duda? Nuestro soporte técnico atiende de 10 a 18 h.</p><MetaTrackedLink event="ClickWhatsApp" href="https://wa.me/5491123145742?text=Hola%2C%20tengo%20una%20consulta%20sobre%20Tienda360" aria-label="Consultar por WhatsApp a Tienda360, atención de 10 a 18 horas" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[#187b43] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#0a2a1e]">Preguntar por WhatsApp</MetaTrackedLink></div>
      </div>
    </section>

    <section className="border-y border-[#0a2a1e]/10 bg-white py-12"><div className="mx-auto grid max-w-6xl gap-7 px-5 sm:grid-cols-3 sm:px-8">{[[PackageCheck, "Tus datos protegidos", "La activación conserva toda tu información."], [Headphones, "Soporte técnico por WhatsApp", "¿Tenés un problema o necesitás ayuda? Escribinos de 10 a 18 h."], [Settings2, "Capacitación incluida", "Aprendé desde cero con nuestros videos."]].map(([Icon, title, text]) => { const TrustIcon = Icon as typeof PackageCheck; return <div key={String(title)} className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#fce7c4] text-[#0a2a1e]"><TrustIcon className="size-5" /></span><div><h3 className="font-extrabold">{String(title)}</h3><p className="mt-1 text-sm text-[#0a2a1e]/60">{String(text)}</p>{String(title) === "Soporte técnico por WhatsApp" ? <MetaTrackedLink event="ClickWhatsApp" href="https://wa.me/5491123145742?text=Hola%2C%20necesito%20ayuda%20con%20Tienda360" aria-label="Contactar al soporte técnico de Tienda360 por WhatsApp, disponible de 10 a 18 horas" className="mt-2 inline-flex text-sm font-extrabold text-[#187b43] underline decoration-2 underline-offset-4 hover:text-[#0a2a1e]">Contactar soporte</MetaTrackedLink> : null}</div></div>; })}</div></section>

    <section id="descargar" className="py-20 sm:py-24"><div className="mx-auto max-w-6xl px-5 sm:px-8"><div className="flex flex-col gap-8 rounded-3xl bg-[#ffb343] p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="max-w-xl text-3xl font-black tracking-tight sm:text-4xl">Empezá a vender en menos de 5 minutos</h2><p className="mt-3 max-w-xl text-[#0a2a1e]/70">Descargalo gratis, probalo 3 días con tu comercio real y decidí después.</p></div><div className="flex shrink-0 flex-col gap-3 sm:flex-row"><LandingDownloadButton source="landing_final" ariaLabel="Descargar prueba gratis de Tienda360 para Windows" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#0a2a1e] px-6 py-3 text-sm font-extrabold text-[#f6f4ec] transition hover:bg-[#0f3a2a]"><Download className="mr-2 size-4" />Descargar gratis</LandingDownloadButton><MetaTrackedLink event="ClickWhatsApp" href="https://wa.me/5491123145742" aria-label="Consultar sobre Tienda360 por WhatsApp" className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-[#0a2a1e]/20 px-6 py-3 text-sm font-extrabold transition hover:border-[#0a2a1e]">Hablar por WhatsApp</MetaTrackedLink></div></div></div></section>

    <footer className="bg-[#0a2a1e] text-[#f6f4ec]/65"><div className="mx-auto max-w-6xl px-5 py-10 sm:px-8"><div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 font-black text-[#f6f4ec]"><span className="grid size-8 place-items-center rounded-lg bg-[#ffb343] font-mono text-[9px] text-[#0a2a1e]">360</span>Tienda360</p><div className="flex flex-wrap gap-5 text-sm"><a href="#funciones">Funciones</a><a href="#como-funciona">Cómo funciona</a><a href="#precio">Precio</a><a href="#tutoriales">Tutoriales</a><a href="#nosotros">Sobre nosotros</a><a href="#preguntas">Preguntas frecuentes</a><Link href="/pedido">Seguir pedido</Link></div></div><div className="mt-8 flex flex-col gap-2 border-t border-[#f6f4ec]/15 pt-5 text-xs sm:flex-row sm:justify-between"><span>© 2026 Tienda360. Todos los derechos reservados.</span><span>Tus datos siempre seguros. Nada se borra, nada se pierde.</span></div></div></footer>
  </main>;
}
