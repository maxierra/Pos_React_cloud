"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Barcode,
  BarChart3,
  Banknote,
  Check,
  CircleCheckBig,
  Landmark,
  PackagePlus,
  Pause,
  Play,
  ReceiptText,
  RotateCcw,
  ScanLine,
  ShoppingCart,
  Wallet,
} from "lucide-react";

const PRODUCTS = [
  { name: "Coca-Cola 500 ml", price: 2200, cost: 1350, stock: 24, category: "Bebidas", code: "7790895001223" },
  { name: "Alfajor triple", price: 1800, cost: 980, stock: 18, category: "Golosinas", code: "7790040172374" },
  { name: "Papas fritas 150 g", price: 2100, cost: 1220, stock: 12, category: "Snacks", code: "7791234123490" },
] as const;

const money = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);

type Chapter = "load" | "sale" | "cash" | "dashboard";

function chapterForStep(step: number): Chapter {
  if (step <= 2) return "load";
  if (step <= 7) return "sale";
  if (step === 8) return "cash";
  return "dashboard";
}

const CHAPTERS: { id: Chapter; label: string }[] = [
  { id: "load", label: "Carga" },
  { id: "sale", label: "Venta" },
  { id: "cash", label: "Caja" },
  { id: "dashboard", label: "Dashboard" },
];

export function QuickSaleSimulation() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const chapter = chapterForStep(step);
  const saleCount = Math.max(0, Math.min(step - 2, 3));
  const visibleProducts = PRODUCTS.slice(0, saleCount);
  const total = useMemo(() => visibleProducts.reduce((sum, product) => sum + product.price, 0), [visibleProducts]);

  useEffect(() => {
    if (!playing) return;
    const normalDurations = [1300, 1900, 1200, 1250, 1250, 1250, 1100, 3200, 2400, 2800, 1800];
    const duration = reduceMotion ? 850 : normalDurations[step] ?? 1500;
    const timer = window.setTimeout(() => setStep((current) => (current >= 10 ? 0 : current + 1)), duration);
    return () => window.clearTimeout(timer);
  }, [playing, reduceMotion, step]);

  const status =
    step === 0 ? "Leyendo código de barras..." :
    step === 1 ? "Producto encontrado automáticamente" :
    step === 2 ? "Producto guardado con stock inicial" :
    step <= 5 ? `Escaneando venta · ${saleCount} de 3` :
    step === 6 ? "Procesando cobro en efectivo..." :
    step === 7 ? "Emitiendo Factura C directamente en ARCA..." :
    step === 8 ? "Caja diaria actualizada" :
    step === 9 ? "Dashboard actualizado en tiempo real" : "Recorrido completo";

  return (
    <div className="relative overflow-hidden rounded-[1.7rem] border border-white/14 bg-[#14231c] p-2 shadow-[0_40px_100px_-35px_rgba(0,0,0,.8)]" aria-label="Demostración automática de carga, venta, caja y dashboard de Tienda360">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5 sm:px-4 sm:py-3">
        <span className="size-2.5 rounded-full bg-rose-400" /><span className="size-2.5 rounded-full bg-amber-300" /><span className="size-2.5 rounded-full bg-emerald-400" />
        <div className="ml-2 flex-1 truncate rounded-md bg-white/6 px-3 py-1.5 text-center text-[9px] text-white/40 sm:text-[10px]">Tienda360 · Recorrido automático</div>
        <button type="button" onClick={() => setPlaying((value) => !value)} className="flex size-7 items-center justify-center rounded-full bg-white/8 text-white/60 transition hover:bg-white/15 hover:text-white" aria-label={playing ? "Pausar demostración" : "Reanudar demostración"}>
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </button>
      </div>

      <div className="bg-[#f4f6f2] px-3 pb-2 pt-3 text-slate-950 sm:px-4">
        <div className="grid grid-cols-4 gap-1.5">
          {CHAPTERS.map((item, index) => {
            const activeIndex = CHAPTERS.findIndex((entry) => entry.id === chapter);
            const active = item.id === chapter;
            const done = index < activeIndex;
            return <div key={item.id} className={`rounded-lg px-1.5 py-2 text-center text-[9px] font-extrabold uppercase tracking-wide transition sm:text-[10px] ${active ? "bg-[#09130f] text-[#c8ff5a]" : done ? "bg-emerald-100 text-emerald-800" : "bg-white text-slate-400"}`}>{done ? <Check className="mr-1 inline size-3" /> : null}{index + 1}. {item.label}</div>;
          })}
        </div>
      </div>

      <div className="flex min-h-[440px] flex-col bg-[#f4f6f2] p-3 pt-1 text-slate-950 sm:min-h-[465px] sm:p-4 sm:pt-2">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div><p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-emerald-700">Demo en vivo</p><h3 className="mt-0.5 text-sm font-extrabold sm:text-base">{CHAPTERS.find((item) => item.id === chapter)?.label}</h3></div>
          <span className="inline-flex max-w-[65%] items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-right text-[9px] font-bold text-slate-600 shadow-sm sm:text-[10px]"><span className="size-1.5 shrink-0 animate-pulse rounded-full bg-emerald-500" />{status}</span>
        </div>

        <AnimatePresence mode="wait">
          {chapter === "load" ? <LoadScreen key="load" step={step} reduceMotion={Boolean(reduceMotion)} /> : null}
          {chapter === "sale" ? <SaleScreen key="sale" step={step} products={visibleProducts} total={total} reduceMotion={Boolean(reduceMotion)} /> : null}
          {chapter === "cash" ? <CashScreen key="cash" reduceMotion={Boolean(reduceMotion)} /> : null}
          {chapter === "dashboard" ? <DashboardScreen key="dashboard" completed={step === 10} reduceMotion={Boolean(reduceMotion)} /> : null}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 px-3 py-2.5 text-[10px] text-white/45 sm:px-4"><span>El recorrido completo dura unos segundos</span><button type="button" onClick={() => { setStep(0); setPlaying(true); }} className="inline-flex items-center gap-1.5 font-bold text-[#c8ff5a] hover:text-white"><RotateCcw className="size-3" /> Repetir</button></div>
    </div>
  );
}

function LoadScreen({ step, reduceMotion }: { step: number; reduceMotion: boolean }) {
  const found = step >= 1;
  const saved = step >= 2;
  return <motion.div initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid flex-1 gap-3 sm:grid-cols-[.8fr_1.2fr]">
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-[#09130f] p-5 text-white">
      <div className="relative flex size-28 items-center justify-center rounded-2xl border border-[#c8ff5a]/35 bg-[#c8ff5a]/8"><Barcode className="size-14 text-[#c8ff5a]" />{!found && !reduceMotion ? <motion.div className="absolute left-3 right-3 h-0.5 bg-red-400 shadow-[0_0_12px_2px_rgba(248,113,113,.8)]" initial={{ top: 18 }} animate={{ top: 92 }} transition={{ duration: .8, repeat: Infinity, repeatType: "reverse" }} /> : null}</div>
      <p className="mt-4 text-center text-xs font-bold">{found ? "Código reconocido" : "Acercá el producto al lector"}</p><p className="mt-1 font-mono text-[10px] text-white/45">7790895001223</p>
    </div>
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><p className="flex items-center gap-2 text-sm font-extrabold"><PackagePlus className="size-4 text-emerald-700" /> Nuevo producto</p>{saved ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-bold text-emerald-800">Guardado ✓</span> : null}</div><div className="mt-4 grid gap-2.5 sm:grid-cols-2">{[
      ["Código EAN", "7790895001223"], ["Producto", found ? "Coca-Cola 500 ml" : "Buscando..."], ["Categoría", found ? "Bebidas" : "—"], ["Marca", found ? "Coca-Cola" : "—"], ["Precio de venta", found ? "$2.200" : "—"], ["Stock inicial", found ? "24 unidades" : "—"],
    ].map(([label, value], index) => <motion.div key={label} initial={found && !reduceMotion ? { opacity: 0, y: 5 } : false} animate={{ opacity: 1, y: 0 }} transition={{ delay: found ? index * .08 : 0 }} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-1 truncate text-[10px] font-bold ${found ? "text-slate-800" : "text-slate-400"}`}>{value}</p></motion.div>)}</div><div className={`mt-3 flex h-9 items-center justify-center rounded-lg text-[10px] font-extrabold ${saved ? "bg-emerald-600 text-white" : found ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-400"}`}>{saved ? "Producto cargado correctamente" : found ? "Guardar producto" : "Esperando lectura"}</div></div>
  </motion.div>;
}

function SaleScreen({ step, products, total, reduceMotion }: { step: number; products: readonly (typeof PRODUCTS)[number][]; total: number; reduceMotion: boolean }) {
  const paying = step === 6;
  const ticket = step === 7;
  const activeIndex = Math.min(Math.max(step - 3, 0), 2);
  return <motion.div initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative grid flex-1 gap-3 sm:grid-cols-[1.05fr_.95fr]">
    <div className="rounded-xl border border-slate-200 bg-white p-3"><div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"><div className="flex items-center gap-2 text-[10px] text-slate-500"><ScanLine className="size-4 text-emerald-600" /><span className="font-mono">{step <= 5 ? PRODUCTS[activeIndex].code : "Lectura completada"}</span></div></div><div className="mt-3 grid grid-cols-3 gap-2">{PRODUCTS.map((product, index) => { const added = index < products.length; return <div key={product.name} className={`relative rounded-lg border p-2 ${added ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}><div className="flex aspect-square items-center justify-center rounded-md bg-white"><Barcode className={`size-6 ${added ? "text-emerald-700" : "text-slate-300"}`} /></div><p className="mt-1.5 line-clamp-2 text-[8px] font-bold leading-tight">{product.name}</p><p className="mt-1 text-[9px] font-extrabold text-emerald-700">{money(product.price)}</p>{added ? <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-emerald-600 text-white"><Check className="size-2.5" /></span> : null}</div>; })}</div></div>
    <div className="relative flex flex-col rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-center justify-between"><p className="flex items-center gap-1.5 text-xs font-extrabold"><ShoppingCart className="size-4 text-emerald-700" /> Carrito</p><span className="text-[9px] font-bold text-slate-400">{products.length} items</span></div><div className="mt-2 flex-1 space-y-1.5">{products.map((product) => <motion.div key={product.name} initial={reduceMotion ? false : { opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between rounded-lg bg-slate-50 px-2.5 py-2 text-[9px]"><span className="font-bold">{product.name}</span><span className="font-extrabold">{money(product.price)}</span></motion.div>)}</div><div className="border-t border-slate-200 pt-2"><div className="flex items-end justify-between"><span className="text-[10px] font-bold text-slate-500">Total</span><span className="text-xl font-black">{money(total || 6100)}</span></div><div className="mt-2 flex h-9 items-center justify-center rounded-lg bg-emerald-600 text-[10px] font-extrabold text-white">{paying ? "Procesando $7.000 · Vuelto $900" : ticket ? "Venta registrada ✓" : "Cobrar venta"}</div></div>
      {ticket ? <ArcaTicketOverlay reduceMotion={reduceMotion} /> : null}
    </div>
  </motion.div>;
}

function ArcaTicketOverlay({ reduceMotion }: { reduceMotion: boolean }) {
  const [authorized, setAuthorized] = useState(reduceMotion);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setTimeout(() => setAuthorized(true), 1100);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  return <motion.div initial={reduceMotion ? false : { opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-x-5 top-3 z-10 sm:inset-x-6 sm:top-4">
    <AnimatePresence mode="wait">
      {!authorized ? (
        <motion.div key="arca-sending" initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }} className="rounded-xl border border-sky-200 bg-white p-5 text-center shadow-2xl">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-sky-100 text-sky-700"><Landmark className="size-6" /></span>
          <p className="mt-3 text-xs font-black text-slate-900">Conectando con ARCA</p>
          <p className="mt-1 text-[8px] text-slate-500">Solicitando autorización de Factura C...</p>
          <div className="mx-auto mt-3 h-1.5 w-28 overflow-hidden rounded-full bg-slate-100"><motion.div className="h-full rounded-full bg-sky-600" initial={{ width: "8%" }} animate={{ width: "100%" }} transition={{ duration: 1 }} /></div>
        </motion.div>
      ) : (
        <motion.div key="arca-ticket" initial={reduceMotion ? false : { opacity: 0, y: 16, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} className="rounded-sm bg-[#fffdf7] p-4 font-mono shadow-2xl">
          <div className="flex items-center justify-between gap-2"><span className="rounded bg-emerald-100 px-2 py-1 text-[7px] font-black text-emerald-800">ARCA AUTORIZADA ✓</span><span className="text-[6px] text-slate-400">Datos de demostración</span></div>
          <p className="mt-3 text-center text-[10px] font-black tracking-[.16em]">TIENDA360</p>
          <p className="text-center text-[7px] font-bold">FACTURA C · N.º 0001-00000482</p>
          <div className="my-2 border-t border-dashed" />
          {PRODUCTS.map((product) => <div key={product.name} className="flex justify-between py-0.5 text-[7px]"><span>{product.name}</span><span>{money(product.price)}</span></div>)}
          <div className="my-2 border-t border-dashed" />
          <div className="flex justify-between text-[10px] font-black"><span>TOTAL</span><span>$6.100</span></div>
          <div className="mt-2 rounded border border-dashed border-slate-300 p-2 text-[6px] leading-3 text-slate-500"><div className="flex justify-between"><span>CAE</span><strong className="text-slate-700">74234567890123</strong></div><div className="flex justify-between"><span>Vencimiento CAE</span><strong className="text-slate-700">20/08/2026</strong></div></div>
          <p className="mt-2 text-center text-[7px] font-bold text-emerald-700">FACTURA EMITIDA · VENTA FINALIZADA ✓</p>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>;
}

function CashScreen({ reduceMotion }: { reduceMotion: boolean }) {
  return <motion.div initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid flex-1 gap-3 sm:grid-cols-[.85fr_1.15fr]"><div className="rounded-xl bg-[#09130f] p-5 text-white"><div className="flex items-center gap-2 text-xs font-bold text-[#c8ff5a]"><Wallet className="size-4" /> Caja abierta</div><p className="mt-5 text-[10px] text-white/45">Saldo esperado</p><motion.p initial={reduceMotion ? false : { scale: .88 }} animate={{ scale: 1 }} className="mt-1 text-3xl font-black">$26.100</motion.p><div className="mt-5 rounded-lg bg-white/7 p-3"><div className="flex justify-between text-[9px] text-white/50"><span>Apertura</span><span>$20.000</span></div><div className="mt-2 flex justify-between text-[9px]"><span>Venta recién registrada</span><span className="font-bold text-[#c8ff5a]">+$6.100</span></div></div></div><div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><p className="text-xs font-extrabold">Movimientos de hoy</p><span className="rounded-full bg-emerald-100 px-2 py-1 text-[8px] font-bold text-emerald-800">Actualizado ahora</span></div><div className="mt-3 space-y-2">{[["Apertura de caja", "+$20.000", "08:30"], ["Venta #000481", "+$4.500", "10:14"], ["Venta #000482", "+$6.100", "10:18"]].map(([name, amount, time], index) => <motion.div key={name} initial={reduceMotion ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .12 }} className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${index === 2 ? "border border-emerald-200 bg-emerald-50" : "bg-slate-50"}`}><div><p className="text-[9px] font-bold">{name}</p><p className="text-[8px] text-slate-400">{time} · Efectivo</p></div><span className="text-[10px] font-extrabold text-emerald-700">{amount}</span></motion.div>)}</div><div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-lg bg-slate-100 p-2.5"><p className="text-[8px] text-slate-400">Ventas efectivo</p><p className="mt-1 text-sm font-black">$10.600</p></div><div className="rounded-lg bg-slate-100 p-2.5"><p className="text-[8px] text-slate-400">Diferencia</p><p className="mt-1 text-sm font-black text-emerald-700">$0</p></div></div></div></motion.div>;
}

function DashboardScreen({ completed, reduceMotion }: { completed: boolean; reduceMotion: boolean }) {
  const bars = [36, 48, 42, 66, 54, 76, 91];
  return <motion.div initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative flex-1 rounded-xl border border-slate-200 bg-white p-3 sm:p-4"><div className="flex items-center justify-between"><p className="flex items-center gap-2 text-xs font-extrabold"><BarChart3 className="size-4 text-emerald-700" /> Resumen del día</p><span className="flex items-center gap-1 text-[8px] font-bold text-emerald-700"><span className="size-1.5 animate-pulse rounded-full bg-emerald-500" /> En vivo</span></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{[["Ventas de hoy", "$48.750"], ["Tickets", "9"], ["Ticket promedio", "$5.417"], ["Caja actual", "$26.100"]].map(([label, value], index) => <motion.div key={label} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .1 }} className={index === 0 ? "rounded-lg bg-emerald-100 p-3" : "rounded-lg bg-slate-100 p-3"}><p className="text-[8px] font-bold text-slate-500">{label}</p><p className="mt-1 text-sm font-black sm:text-base">{value}</p>{index === 0 ? <p className="mt-1 flex items-center text-[7px] font-bold text-emerald-700"><ArrowUpRight className="size-2.5" /> +14% vs. ayer</p> : null}</motion.div>)}</div><div className="mt-3 grid gap-3 sm:grid-cols-[1.3fr_.7fr]"><div className="rounded-lg border border-slate-200 p-3"><div className="flex justify-between"><p className="text-[9px] font-bold">Ventas por hora</p><p className="text-[8px] text-slate-400">08:00 — 18:00</p></div><div className="mt-3 flex h-24 items-end gap-2">{bars.map((height, index) => <div key={index} className="flex flex-1 items-end rounded-sm bg-slate-100"><motion.div initial={{ height: reduceMotion ? `${height}%` : 0 }} animate={{ height: `${height}%` }} transition={{ duration: .55, delay: index * .07 }} className={`w-full rounded-sm ${index === bars.length - 1 ? "bg-[#c8ff5a]" : "bg-emerald-600"}`} /></div>)}</div></div><div className="rounded-lg border border-slate-200 p-3"><p className="text-[9px] font-bold">Medios de pago</p><div className="mt-3 space-y-2">{[["Efectivo", "$26.100", "bg-emerald-500"], ["Tarjeta", "$14.650", "bg-amber-400"], ["Transferencia", "$8.000", "bg-violet-400"]].map(([label, value, color]) => <div key={label} className="flex items-center justify-between text-[8px]"><span className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${color}`} />{label}</span><span className="font-extrabold">{value}</span></div>)}</div></div></div>{completed ? <motion.div initial={reduceMotion ? false : { opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/88 backdrop-blur-sm"><div className="text-center"><span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100"><CircleCheckBig className="size-7 text-emerald-700" /></span><p className="mt-3 text-lg font-black">Todo conectado</p><p className="mt-1 max-w-xs text-[10px] leading-4 text-slate-500">Cargás, vendés y ves el resultado de tu negocio en tiempo real.</p></div></motion.div> : null}</motion.div>;
}
