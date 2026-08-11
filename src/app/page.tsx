import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Barcode,
  BarChart3,
  Boxes,
  Check,
  CircleCheckBig,
  Clock3,
  CreditCard,
  Headphones,
  Laptop,
  MapPin,
  MessageCircle,
  PackageCheck,
  PlayCircle,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { LandingVideoTutorials } from "@/components/landing/LandingVideoTutorials";
import { QuickSaleSimulation } from "@/components/landing/QuickSaleSimulation";
import { PromoPurchaseCta } from "@/components/landing/PromoPurchaseCta";
import { SoftwarePurchaseModal } from "@/components/landing/software-purchase-modal";
import { DESKTOP_DOWNLOAD_TRACKED_PATH } from "@/lib/desktop-download";
import {
  formatStorePrice,
  getStoreProductBySku,
  getStoreSoftwarePromoConfig,
} from "@/lib/store-products";
import demoImage from "@/demo.png";

const sora = { className: "font-sans" };
const inter = { className: "font-sans" };

const benefits = [
  { icon: Zap, title: "Vendé sin demoras", description: "Buscá por nombre o código, armá el carrito y cobrá en pocos pasos." },
  { icon: Boxes, title: "Stock siempre claro", description: "Controlá existencias, costos y precios desde el mismo lugar." },
  { icon: ReceiptText, title: "Caja bajo control", description: "Registrá aperturas, cierres y movimientos de cada jornada." },
  { icon: BarChart3, title: "Decidí con datos", description: "Consultá ventas e informes sin depender de planillas sueltas." },
];

const included = [
  "Punto de venta y caja diaria",
  "Productos, precios y stock",
  "Clientes y cuenta corriente",
  "Usuarios y permisos",
  "Ventas, reportes y anulaciones",
  "Etiquetas y códigos de barras",
  "Proveedores y movimientos",
  "Actualizaciones incluidas",
];

const steps = [
  { icon: CreditCard, number: "01", title: "Comprás online", text: "Pagás de forma segura a través de Mercado Pago." },
  { icon: PackageCheck, number: "02", title: "Recibís el acceso", text: "Cuando se acredita el pago, se habilita la descarga." },
  { icon: Headphones, number: "03", title: "Empezás acompañado", text: "Te ayudamos con la puesta en marcha y tus primeras dudas." },
];

export default async function Home({ searchParams }: { searchParams?: Promise<{ missingSupabase?: string }> }) {
  const sp = (await searchParams) ?? {};
  const softwareProduct = await getStoreProductBySku("software_lifetime");
  const softwareListAmount = softwareProduct?.price_ars ?? 100_000;
  const softwarePromo = getStoreSoftwarePromoConfig(softwareListAmount);
  const softwareListPrice = formatStorePrice(softwarePromo.listAmount);
  const softwarePromoPrice = formatStorePrice(softwarePromo.payAmount);

  return (
    <main className={`${inter.className} overflow-hidden bg-[#f5f6ef] text-slate-950`}>
      {sp.missingSupabase ? (
        <div className="border-b border-amber-300 bg-amber-100 px-4 py-3 text-center text-sm text-amber-950">
          Falta configurar Supabase en <code className="rounded bg-white px-1">.env.local</code>.
        </div>
      ) : null}

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#09130f]/90 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="#inicio" className={`${sora.className} flex items-center gap-2.5 text-lg font-extrabold tracking-tight`}>
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#c8ff5a] text-[#09130f]"><BadgeCheck className="size-5" /></span>
            Tienda360 <span className="text-[#c8ff5a]">POS</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-medium text-white/70 lg:flex" aria-label="Navegación principal">
            <a href="#funciones" className="transition hover:text-white">Funciones</a>
            <a href="#como-funciona" className="transition hover:text-white">Cómo funciona</a>
            <a href="#tutoriales" className="transition hover:text-white">Tutoriales</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link href="/auth/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white sm:inline-flex">Ingresar</Link>
            <a href="#comprar" className="inline-flex h-10 items-center rounded-full bg-[#c8ff5a] px-4 text-sm font-bold text-[#09130f] transition hover:bg-[#d8ff89]">
              {softwarePromo.discountPercent}% OFF <ArrowRight className="ml-1.5 size-4" />
            </a>
          </div>
        </div>
      </header>

      <section id="inicio" className="relative bg-[#09130f] pb-18 pt-14 text-white sm:pb-24 sm:pt-20">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.055)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="absolute -right-24 top-16 size-96 rounded-full bg-emerald-500/20 blur-[110px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:px-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c8ff5a]/30 bg-[#c8ff5a]/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[.18em] text-[#d8ff89]">
              <Sparkles className="size-3.5" /> Hecho para comercios argentinos
            </div>
            <h1 className={`${sora.className} mt-6 max-w-3xl text-4xl font-extrabold leading-[1.02] tracking-[-.045em] sm:text-6xl lg:text-[4.35rem]`}>
              Tu negocio en orden. <span className="text-[#c8ff5a]">Tus ventas, en movimiento.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/67">
              Vendé más rápido y controlá stock, caja y reportes desde un sistema simple, completo y listo para usar en Windows.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PromoPurchaseCta price={softwarePromoPrice} promoCode={softwarePromo.code} discountPercent={softwarePromo.discountPercent} />
              <a href="#demo" className="inline-flex h-13 items-center justify-center rounded-full border border-white/18 bg-white/7 px-6 text-sm font-bold text-white transition hover:bg-white/12">
                <PlayCircle className="mr-2 size-4" /> Probar demo gratis
              </a>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-white/55">
              <span className="flex items-center gap-1.5"><CircleCheckBig className="size-4 text-[#c8ff5a]" /> Con cupón {softwarePromo.code}: {softwarePromoPrice}</span>
              <span className="flex items-center gap-1.5"><CircleCheckBig className="size-4 text-[#c8ff5a]" /> Licencia de por vida</span>
              <span className="flex items-center gap-1.5"><CircleCheckBig className="size-4 text-[#c8ff5a]" /> Soporte cercano</span>
            </div>
          </div>

          <div className="relative lg:pl-4">
            <div className="absolute -inset-8 rounded-full bg-[#c8ff5a]/10 blur-3xl" />
            <QuickSaleSimulation />
            <div className="absolute -bottom-5 -left-3 rounded-2xl border border-white/10 bg-white p-4 text-slate-950 shadow-2xl sm:-left-8">
              <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-emerald-100"><Clock3 className="size-5 text-emerald-700" /></span><div><p className="text-xs text-slate-500">Todo listo para vender</p><p className="text-sm font-extrabold">Simple desde el primer día</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-slate-200 px-5 sm:grid-cols-4 sm:px-8 lg:px-12">
          {["Venta ágil", "Stock actualizado", "Caja ordenada", "Soporte directo"].map((item) => <div key={item} className="flex items-center justify-center gap-2 py-4 text-xs font-bold text-slate-600 sm:text-sm"><Check className="size-4 text-emerald-600" />{item}</div>)}
        </div>
      </div>

      <section id="funciones" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr]">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-emerald-700">Menos complicaciones</p>
            <h2 className={`${sora.className} mt-4 text-3xl font-extrabold leading-tight tracking-[-.035em] sm:text-5xl`}>Todo lo que necesitás para manejar mejor tu comercio.</h2>
            <p className="mt-5 text-base leading-7 text-slate-600">Una sola herramienta para trabajar más rápido, reducir errores y saber qué pasa en tu negocio.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map(({ icon: Icon, title, description }, index) => (
              <article key={title} className={`rounded-[1.6rem] border p-6 ${index === 0 ? "border-[#c8ff5a] bg-[#dfff9e]" : "border-slate-200 bg-white"}`}>
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#09130f] text-[#c8ff5a]"><Icon className="size-5" /></div>
                <h3 className={`${sora.className} mt-5 text-xl font-bold tracking-tight`}>{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-[#e9eddf] py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-extrabold uppercase tracking-[.22em] text-emerald-700">Empezá sin vueltas</p><h2 className={`${sora.className} mt-4 text-3xl font-extrabold tracking-[-.035em] sm:text-5xl`}>De la compra a tu primera venta.</h2></div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {steps.map(({ icon: Icon, number, title, text }) => <article key={number} className="relative rounded-[1.6rem] bg-white p-7"><span className={`${sora.className} absolute right-6 top-5 text-4xl font-extrabold text-slate-100`}>{number}</span><div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800"><Icon className="size-5" /></div><h3 className={`${sora.className} mt-5 text-xl font-bold`}>{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}
          </div>
        </div>
      </section>

      <section id="comprar" className="bg-[#09130f] py-20 text-white lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:px-12">
          <div>
            <div className="inline-flex rounded-full bg-[#c8ff5a] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[.15em] text-[#09130f]">Cupón exclusivo · {softwarePromo.discountPercent}% OFF</div>
            <h2 className={`${sora.className} mt-5 text-4xl font-extrabold tracking-[-.04em] sm:text-5xl`}>Una inversión. Tu sistema, para siempre.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/65">Accedé al software completo con licencia de por vida. Ingresá el cupón antes de pagar y obtené el descuento automáticamente.</p>
            <div className="mt-8 flex flex-wrap items-end gap-3"><span className={`${sora.className} text-5xl font-extrabold text-[#c8ff5a] sm:text-6xl`}>{softwarePromoPrice}</span><span className="pb-2 text-sm text-white/45"><span className="block line-through">Precio normal {softwareListPrice}</span>con cupón {softwarePromo.code}</span></div>
            <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-[#c8ff5a]/25 bg-[#c8ff5a]/10 px-4 py-3">
              <span className="rounded-lg bg-[#c8ff5a] px-3 py-1.5 font-mono text-sm font-black tracking-wider text-[#09130f]">{softwarePromo.code}</span>
              <span className="text-xs leading-5 text-white/70">Copialo e ingresalo en el formulario<br />antes de continuar a Mercado Pago.</span>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">{included.map((item) => <div key={item} className="flex items-start gap-2.5 text-sm text-white/75"><CircleCheckBig className="mt-0.5 size-4 shrink-0 text-[#c8ff5a]" />{item}</div>)}</div>
          </div>
          <div className="rounded-[2rem] border border-white/12 bg-white p-5 text-slate-950 shadow-2xl sm:p-7">
            <div className="relative overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-[#09130f] via-[#12251c] to-emerald-900 p-4 pb-9 pt-5 sm:p-6 sm:pb-11">
              <div className="absolute -right-16 -top-16 size-48 rounded-full bg-[#c8ff5a]/20 blur-3xl" />
              <div className="relative overflow-hidden rounded-xl border border-white/15 bg-[#17251f] p-1.5 shadow-[0_28px_60px_-22px_rgba(0,0,0,.85)]">
                <div className="flex items-center gap-1.5 px-2 py-2">
                  <span className="size-2 rounded-full bg-rose-400" />
                  <span className="size-2 rounded-full bg-amber-300" />
                  <span className="size-2 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-[8px] font-medium text-white/35">Tienda360 · Punto de venta</span>
                  <span className="ml-auto rounded-full bg-[#c8ff5a]/15 px-2 py-0.5 text-[7px] font-bold text-[#c8ff5a]">EN LÍNEA</span>
                </div>
                <div className="grid min-h-[260px] grid-cols-[64px_1fr] overflow-hidden rounded-lg bg-[#f3f5f1] sm:min-h-[300px] sm:grid-cols-[82px_1fr]" role="img" aria-label="Representación de Tienda360 ejecutándose como software de escritorio en una PC">
                  <div className="bg-[#09130f] p-2 text-white sm:p-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#c8ff5a] text-[#09130f]"><BadgeCheck className="size-4" /></div>
                    <div className="mt-5 space-y-2">
                      {["Venta", "Stock", "Caja", "Reportes"].map((label, index) => <div key={label} className={`rounded-md px-1.5 py-2 text-[6px] font-bold sm:text-[7px] ${index === 0 ? "bg-[#c8ff5a] text-[#09130f]" : "bg-white/5 text-white/45"}`}>{label}</div>)}
                    </div>
                  </div>
                  <div className="flex flex-col p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-3"><div><p className="text-[7px] font-bold uppercase tracking-wider text-emerald-700">Punto de venta</p><p className="mt-0.5 text-xs font-black text-slate-900 sm:text-sm">Nueva venta</p></div><div className="rounded-lg bg-white px-2 py-1 text-[7px] font-bold text-slate-500 shadow-sm">Caja abierta</div></div>
                    <div className="mt-3 grid flex-1 gap-2 sm:grid-cols-[1.1fr_.9fr]">
                      <div className="rounded-lg bg-white p-2.5 shadow-sm">
                        <div className="flex items-center gap-2 rounded-md bg-slate-100 px-2 py-2 text-[7px] text-slate-400"><Barcode className="size-3" /> Escanear código o buscar producto...</div>
                        <div className="mt-2 grid grid-cols-3 gap-1.5">
                          {[["Bebida", "$2.200"], ["Alfajor", "$1.800"], ["Snacks", "$2.100"], ["Yerba", "$3.900"], ["Agua", "$1.300"], ["Café", "$4.200"]].map(([name, price], index) => <div key={name} className={`rounded-md border p-1.5 ${index === 0 ? "border-emerald-300 bg-emerald-50" : "border-slate-100 bg-slate-50"}`}><div className={`flex h-7 items-center justify-center rounded ${index === 0 ? "bg-emerald-100" : "bg-white"}`}><Boxes className={`size-3 ${index === 0 ? "text-emerald-700" : "text-slate-300"}`} /></div><p className="mt-1 truncate text-[6px] font-bold">{name}</p><p className="text-[6px] font-black text-emerald-700">{price}</p></div>)}
                        </div>
                      </div>
                      <div className="flex flex-col rounded-lg bg-white p-2.5 shadow-sm"><div className="flex items-center justify-between"><p className="text-[8px] font-black">Carrito</p><span className="rounded bg-slate-100 px-1.5 py-0.5 text-[6px] font-bold text-slate-400">3 items</span></div><div className="mt-2 flex-1 space-y-1.5">{[["Coca-Cola 500 ml", "$2.200"], ["Alfajor triple", "$1.800"], ["Papas fritas", "$2.100"]].map(([name, price]) => <div key={name} className="flex justify-between rounded bg-slate-50 px-2 py-1.5 text-[6px]"><span className="font-bold">{name}</span><span className="font-black">{price}</span></div>)}</div><div className="border-t border-slate-100 pt-2"><div className="flex items-end justify-between"><span className="text-[7px] font-bold text-slate-400">Total</span><span className="text-base font-black">$6.100</span></div><div className="mt-2 rounded-md bg-emerald-600 py-2 text-center text-[7px] font-black text-white">Cobrar venta</div></div></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-3 left-7 flex items-center gap-2 rounded-xl border border-white/10 bg-white px-3 py-2 text-slate-950 shadow-xl sm:left-9">
                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100"><ReceiptText className="size-3.5 text-emerald-700" /></span>
                <span><span className="block text-[7px] font-semibold text-slate-400">Facturación</span><span className="block text-[9px] font-extrabold">ARCA integrada</span></span>
              </div>
              <div className="absolute bottom-3 right-7 flex items-center gap-2 rounded-xl border border-white/10 bg-[#c8ff5a] px-3 py-2 text-[#09130f] shadow-xl sm:right-9">
                <CircleCheckBig className="size-4" />
                <span className="text-[9px] font-extrabold">Software completo</span>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between gap-4"><div><p className="text-sm text-slate-500">Con el cupón {softwarePromo.code}</p><p className={`${sora.className} text-2xl font-extrabold`}>Pagás {softwarePromoPrice}</p></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">{softwarePromo.discountPercent}% OFF</span></div>
            <div className="mt-6"><SoftwarePurchaseModal listAmount={softwarePromo.listAmount} promoCode={softwarePromo.code} discountPercent={softwarePromo.discountPercent} promoAmount={softwarePromo.payAmount} /></div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck className="size-4 text-emerald-600" /> Pago procesado de forma segura por Mercado Pago</div>
          </div>
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
        <div className="grid items-center gap-12 rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1"><Image src={demoImage} alt="Versión demo de Tienda360" className="max-h-[500px] w-full object-contain" sizes="(max-width: 1024px) 100vw, 50vw" /></div>
          <div className="order-1 lg:order-2"><p className="text-xs font-extrabold uppercase tracking-[.22em] text-emerald-700">¿Preferís verlo primero?</p><h2 className={`${sora.className} mt-4 text-3xl font-extrabold tracking-[-.035em] sm:text-5xl`}>Probalo gratis en tu PC.</h2><p className="mt-5 text-base leading-7 text-slate-600">Descargá la demo, recorré las funciones principales y comprobá si encaja con la forma de trabajar de tu comercio.</p><a href={`${DESKTOP_DOWNLOAD_TRACKED_PATH}?source=landing_demo`} className="mt-7 inline-flex h-12 items-center rounded-full bg-[#09130f] px-6 text-sm font-bold text-white transition hover:bg-emerald-900"><Laptop className="mr-2 size-4" /> Descargar demo para Windows</a><p className="mt-4 text-xs leading-5 text-slate-500">Compatible con Windows 10 o superior de 64 bits. Si luego elegís la licencia completa, su precio regular es $100.000.</p></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12"><LandingVideoTutorials /></section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-12">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#c8ff5a] px-6 py-12 sm:px-12">
          <div className="absolute -right-20 -top-20 size-64 rounded-full border-[40px] border-[#09130f]/7" />
          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center"><div><p className="text-xs font-extrabold uppercase tracking-[.2em] text-emerald-900">¿Todavía tenés dudas?</p><h2 className={`${sora.className} mt-3 max-w-2xl text-3xl font-extrabold tracking-[-.035em] sm:text-4xl`}>Hablemos de tu comercio y te ayudamos a elegir.</h2><p className="mt-3 text-sm text-emerald-950/70"><MapPin className="mr-1 inline size-4" /> Atención directa desde Belgrano, CABA.</p></div><a href="https://wa.me/5491123145742?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20Tienda360%20POS" target="_blank" rel="noreferrer" className="inline-flex h-13 shrink-0 items-center justify-center rounded-full bg-[#09130f] px-6 text-sm font-bold text-white"><MessageCircle className="mr-2 size-4" /> Consultar por WhatsApp</a></div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#09130f] text-white/55">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.3fr_.7fr_.7fr] lg:px-12"><div><div className={`${sora.className} text-lg font-extrabold text-white`}>Tienda360 <span className="text-[#c8ff5a]">POS</span></div><p className="mt-3 max-w-sm text-sm leading-6">Gestión simple y completa para comercios que quieren vender mejor.</p></div><div><p className="text-sm font-bold text-white">Producto</p><div className="mt-3 grid gap-2 text-sm"><a href="#funciones">Funciones</a><a href="#demo">Demo</a><a href="#comprar">Comprar</a></div></div><div><p className="text-sm font-bold text-white">Contacto</p><div className="mt-3 grid gap-2 text-sm"><a href="https://wa.me/5491123145742">WhatsApp</a><span>Belgrano, CABA</span><Link href="/auth/login">Ingresar</Link></div></div></div>
        <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-white/35">© 2026 Tienda360 POS · Todos los derechos reservados</div>
      </footer>
    </main>
  );
}
