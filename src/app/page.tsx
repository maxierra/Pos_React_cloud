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
  Download,
  Laptop,
  MapPin,
  MessageCircle,
  PackageCheck,
  PlayCircle,
  PawPrint,
  ReceiptText,
  ShieldCheck,
  Shirt,
  ShoppingBasket,
  Store,
  UtensilsCrossed,
  Zap,
} from "lucide-react";

import { LandingVideoTutorials } from "@/components/landing/LandingVideoTutorials";
import { QuickSaleSimulation } from "@/components/landing/QuickSaleSimulation";
import { SoftwarePurchaseModal } from "@/components/landing/software-purchase-modal";
import { MobilePurchaseBar } from "@/components/landing/mobile-purchase-bar";
import { MetaPixel } from "@/components/analytics/meta-pixel";
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
  { icon: Zap, title: "Vendé más rápido", description: "Escaneá el código de barras y agregá productos automáticamente a la venta." },
  { icon: Boxes, title: "Controlá tu stock", description: "Sabé qué productos tenés y cuáles necesitás reponer." },
  { icon: ReceiptText, title: "Tené tu caja ordenada", description: "Registrá ventas, ingresos, egresos y medios de pago." },
  { icon: BarChart3, title: "Conocé tus números", description: "Consultá reportes de ventas y rendimiento del negocio." },
  { icon: Barcode, title: "300.000 productos precargados", description: "Ahorrá tiempo al comenzar a utilizar el sistema." },
  { icon: ReceiptText, title: "Imprimí tickets", description: "Compatible con impresoras térmicas utilizadas en comercios." },
];

const businessTypes = [
  { icon: Store, title: "Kioscos", text: "Ventas rápidas, códigos de barras, caja y reposición." },
  { icon: ShoppingBasket, title: "Autoservicios", text: "Miles de productos, precios y stock siempre bajo control." },
  { icon: PawPrint, title: "Pet shops", text: "Organizá alimentos, accesorios, clientes y proveedores." },
  { icon: Shirt, title: "Indumentaria", text: "Gestioná prendas por talle, color y variante." },
  { icon: UtensilsCrossed, title: "Gastronomía", text: "Trabajá con mostrador, mesas, salón y delivery." },
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
  { icon: CreditCard, number: "01", title: "Comprás online", text: "Pagás $50.000 mediante Mercado Pago." },
  { icon: BadgeCheck, number: "02", title: "Se acredita tu pago", text: "Confirmamos automáticamente tu compra." },
  { icon: PackageCheck, number: "03", title: "Recibís el acceso", text: "Recibís el acceso para descargar Tienda360." },
  { icon: Download, number: "04", title: "Lo instalás en tu PC", text: "Descargás e instalás el sistema en Windows." },
  { icon: Headphones, number: "05", title: "Empezás a trabajar", text: "Cargá precios, controlá stock y registrá ventas." },
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
      <MetaPixel />
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
              <Laptop className="size-3.5" /> Exclusivo para PC Windows
            </div>
            <h1 className={`${sora.className} mt-6 max-w-3xl text-4xl font-extrabold leading-[1.02] tracking-[-.045em] sm:text-6xl lg:text-[4.35rem]`}>
              Software de gestión para <span className="text-[#c8ff5a]">PC Windows</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/67">
              Controlá ventas, stock, caja y tu negocio desde un solo sistema.
            </p>
            <div className="mt-6 flex items-end gap-3"><span className="text-lg text-white/45 line-through">{softwareListPrice}</span><strong className="text-4xl font-black text-[#c8ff5a]">{softwarePromoPrice}</strong><span className="mb-1 rounded-full bg-[#c8ff5a] px-2 py-1 text-xs font-black text-[#09130f]">50% OFF</span></div>
            <p className="mt-2 text-sm font-black tracking-wide text-white">PAGO ÚNICO · LICENCIA DE POR VIDA</p>
            <p className="mt-2 text-sm font-semibold text-[#d8ff89]">Se instala en una PC con Windows 10/11 de 64 bits.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <SoftwarePurchaseModal listAmount={softwarePromo.listAmount} promoCode={softwarePromo.code} discountPercent={softwarePromo.discountPercent} promoAmount={softwarePromo.payAmount} primaryMarker triggerLabel={`COMPRAR AHORA POR ${softwarePromoPrice}`} triggerClassName="inline-flex min-h-14 items-center justify-center rounded-xl bg-[#c8ff5a] px-6 text-sm font-black text-[#09130f] shadow-[0_18px_45px_-18px_rgba(200,255,90,.9)] transition hover:bg-[#d8ff89]" />
              <a href="#demo" className="inline-flex h-13 items-center justify-center rounded-full border border-white/18 bg-white/7 px-6 text-sm font-bold text-white transition hover:bg-white/12">
                <PlayCircle className="mr-2 size-4" /> PROBAR GRATIS EN MI PC
              </a>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/75"><strong>Podés comprar desde tu celular.</strong> La instalación se realiza luego en tu PC Windows.</p>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-white/55">
              <span className="flex items-center gap-1.5"><CircleCheckBig className="size-4 text-[#c8ff5a]" /> Descuento aplicado automáticamente</span>
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

      <section className="relative overflow-hidden bg-white py-16 sm:py-20" aria-labelledby="rubros-title">
        <div className="absolute -left-24 top-1/2 size-64 -translate-y-1/2 rounded-full bg-[#c8ff5a]/25 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-emerald-800">Un sistema, muchos comercios</span>
            <h2 id="rubros-title" className={`${sora.className} mt-4 text-3xl font-extrabold tracking-[-.035em] sm:text-5xl`}>
              Tienda360 se adapta a <span className="text-emerald-700">tu rubro</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">Configurá el sistema según la forma de trabajar de tu negocio, sin pagar módulos ni mensualidades adicionales.</p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {businessTypes.map(({ icon: Icon, title, text }, index) => (
              <article key={title} className={`group rounded-[1.5rem] border p-5 transition hover:-translate-y-1 hover:shadow-xl ${index === 0 ? "border-[#b5ef42] bg-[#e8ffb8]" : "border-slate-200 bg-[#f8f9f4]"}`}>
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#09130f] text-[#c8ff5a] transition group-hover:scale-105"><Icon className="size-6" /></div>
                <h3 className={`${sora.className} mt-5 text-lg font-extrabold`}>{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
          <p className="mt-7 text-center text-sm font-bold text-slate-700"><CircleCheckBig className="mr-2 inline size-5 text-emerald-700" />También sirve para almacenes, dietéticas, perfumerías, ferreterías y muchos comercios más.</p>
        </div>
      </section>

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
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map(({ icon: Icon, number, title, text }) => <article key={number} className="relative rounded-[1.6rem] bg-white p-7"><span className={`${sora.className} absolute right-6 top-5 text-4xl font-extrabold text-slate-100`}>{number}</span><div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800"><Icon className="size-5" /></div><h3 className={`${sora.className} mt-5 text-xl font-bold`}>{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}
          </div>
        </div>
      </section>

      <section id="comprar" className="bg-[#09130f] py-20 text-white lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:px-12">
          <div>
            <div className="inline-flex rounded-full bg-[#c8ff5a] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[.15em] text-[#09130f]">{softwarePromo.discountPercent}% OFF · Aplicado automáticamente</div>
            <h2 className={`${sora.className} mt-5 text-4xl font-extrabold tracking-[-.04em] sm:text-5xl`}>Una inversión. Tu sistema, para siempre.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/65">Software completo para Windows, con licencia de por vida, pago único y sin mensualidades.</p>
            <div className="mt-8 flex flex-wrap items-end gap-3"><span className={`${sora.className} text-5xl font-extrabold text-[#c8ff5a] sm:text-6xl`}>{softwarePromoPrice}</span><span className="pb-2 text-sm text-white/45"><span className="block line-through">Antes {softwareListPrice}</span>PAGO ÚNICO</span></div>
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
                  <span className="ml-auto rounded-full bg-[#c8ff5a]/15 px-2 py-0.5 text-[7px] font-bold text-[#c8ff5a]">PARA WINDOWS</span>
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
            <div className="mt-6 flex items-center justify-between gap-4"><div><p className="text-sm text-slate-500">Precio final, sin cupón</p><p className={`${sora.className} text-2xl font-extrabold`}>Pagás {softwarePromoPrice}</p></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">{softwarePromo.discountPercent}% OFF</span></div>
            <div className="mt-6"><SoftwarePurchaseModal listAmount={softwarePromo.listAmount} promoCode={softwarePromo.code} discountPercent={softwarePromo.discountPercent} promoAmount={softwarePromo.payAmount} /></div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck className="size-4 text-emerald-600" /> Pago procesado de forma segura por Mercado Pago</div>
          </div>
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
        <div className="grid items-center gap-12 rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1"><Image src={demoImage} alt="Versión demo de Tienda360" className="max-h-[500px] w-full object-contain" sizes="(max-width: 1024px) 100vw, 50vw" /></div>
          <div className="order-1 lg:order-2"><p className="text-xs font-extrabold uppercase tracking-[.22em] text-emerald-700">¿Preferís verlo primero?</p><h2 className={`${sora.className} mt-4 text-3xl font-extrabold tracking-[-.035em] sm:text-5xl`}>Probalo gratis en tu PC.</h2><p className="mt-5 text-base leading-7 text-slate-600">Descargá la demo, recorré las funciones principales y comprobá si encaja con la forma de trabajar de tu comercio.</p><a href={`${DESKTOP_DOWNLOAD_TRACKED_PATH}?source=landing_demo`} className="mt-7 inline-flex h-12 items-center rounded-full bg-[#09130f] px-6 text-sm font-bold text-white transition hover:bg-emerald-900"><Laptop className="mr-2 size-4" /> Descargar demo para Windows</a><p className="mt-4 text-xs leading-5 text-slate-500">La demo se descarga y utiliza en una PC con Windows 10/11 de 64 bits.</p></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12"><LandingVideoTutorials /></section>

      <section className="bg-white py-20" aria-labelledby="confianza-title">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-emerald-700">Compra clara y segura</p>
            <h2 id="confianza-title" className={`${sora.className} mt-4 text-3xl font-extrabold tracking-[-.035em] sm:text-5xl`}>Comprá con tranquilidad</h2>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {["Pago seguro mediante Mercado Pago", "Pago único", "Sin mensualidades", "Licencia de por vida", "Soporte técnico", "Descarga para Windows", "Software desarrollado por Tienda360"].map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#f5f6ef] p-4 text-sm font-bold"><ShieldCheck className="size-5 shrink-0 text-emerald-700" />{item}</div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-20 sm:px-8" aria-labelledby="faq-title">
        <div className="text-center"><p className="text-xs font-extrabold uppercase tracking-[.22em] text-emerald-700">Sin letra chica</p><h2 id="faq-title" className={`${sora.className} mt-4 text-3xl font-extrabold tracking-[-.035em] sm:text-5xl`}>Preguntas frecuentes</h2></div>
        <div className="mt-10 divide-y divide-slate-200 rounded-[2rem] border border-slate-200 bg-white px-5 sm:px-8">
          {[
            ["¿Funciona en celular?", "No. Esta versión de Tienda360 está diseñada para PC con Windows. Podés comprar desde tu celular y luego descargar e instalar el programa desde tu computadora."],
            ["¿Tengo que pagar todos los meses?", `No. El precio de ${softwarePromoPrice} corresponde a un pago único.`],
            ["¿Qué Windows necesito?", "Windows 10 o Windows 11 de 64 bits."],
            ["¿Qué recibo después de comprar?", "Una vez confirmado el pago recibís el acceso necesario para descargar e instalar Tienda360."],
            ["¿Puedo probarlo antes?", "Sí. Hay disponible una versión demo para Windows."],
            ["¿Necesito conocimientos de informática?", "No. El sistema está pensado para ser simple de utilizar en comercios."],
          ].map(([question, answer]) => <details key={question} className="group py-5"><summary className="cursor-pointer list-none pr-8 text-base font-bold marker:hidden">{question}<span className="float-right text-emerald-700 transition group-open:rotate-45">+</span></summary><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{answer}</p></details>)}
        </div>
      </section>

      <section className="bg-[#09130f] py-20 text-center text-white" aria-labelledby="final-cta-title">
        <div className="mx-auto max-w-3xl px-5">
          <h2 id="final-cta-title" className={`${sora.className} text-3xl font-extrabold tracking-[-.035em] sm:text-5xl`}>Empezá a ordenar tu negocio hoy</h2>
          <p className="mt-4 text-lg font-bold">Tienda360 para Windows</p>
          <p className="mt-5 text-lg text-white/45 line-through">{softwareListPrice}</p>
          <p className="text-5xl font-black text-[#c8ff5a] sm:text-6xl">{softwarePromoPrice}</p>
          <p className="mt-3 font-black">PAGO ÚNICO</p>
          <p className="mt-1 text-sm text-white/65">Sin mensualidades · Licencia de por vida</p>
          <div className="mt-8 flex justify-center"><SoftwarePurchaseModal listAmount={softwarePromo.listAmount} promoCode={softwarePromo.code} discountPercent={softwarePromo.discountPercent} promoAmount={softwarePromo.payAmount} primaryMarker triggerLabel="COMPRAR TIENDA360" triggerClassName="inline-flex min-h-14 items-center justify-center rounded-xl bg-[#c8ff5a] px-8 text-sm font-black text-[#09130f] transition hover:bg-[#d8ff89]" /></div>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/65">Podés comprar desde tu celular y descargar el programa posteriormente desde tu PC Windows.</p>
        </div>
      </section>

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
      <MobilePurchaseBar listAmount={softwarePromo.listAmount} promoCode={softwarePromo.code} discountPercent={softwarePromo.discountPercent} promoAmount={softwarePromo.payAmount} price={softwarePromoPrice} />
    </main>
  );
}
