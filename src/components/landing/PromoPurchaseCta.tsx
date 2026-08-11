"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, TicketPercent } from "lucide-react";

type PromoPurchaseCtaProps = {
  price: string;
  promoCode: string;
  discountPercent: number;
};

export function PromoPurchaseCta({ price, promoCode, discountPercent }: PromoPurchaseCtaProps) {
  const reduceMotion = useReducedMotion();
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    `${discountPercent}% de descuento`,
    `Ingresá el cupón ${promoCode}`,
    `Precio final ${price}`,
  ];

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => setMessageIndex((current) => (current + 1) % messages.length), 2100);
    return () => window.clearInterval(timer);
  }, [messages.length, reduceMotion]);

  return (
    <a
      href="#comprar"
      className="group relative isolate flex min-h-16 min-w-[270px] items-center justify-between overflow-hidden rounded-2xl bg-transparent px-5 py-3 text-[#09130f] shadow-[0_18px_55px_-15px_rgba(200,255,90,.8)] transition hover:-translate-y-1 hover:shadow-[0_24px_65px_-15px_rgba(200,255,90,.95)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c8ff5a]/40"
      aria-label={`Comprar ahora por ${price} usando el cupón ${promoCode}`}
    >
      {!reduceMotion ? (
        <>
          <motion.span
            className="absolute -inset-[180%] -z-10 bg-[conic-gradient(from_0deg,transparent_0deg,transparent_55deg,#ffffff_78deg,#c8ff5a_102deg,transparent_130deg,transparent_235deg,#ffffff_260deg,#c8ff5a_282deg,transparent_310deg)]"
            animate={{ rotate: 360 }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
          />
          <span className="absolute inset-[2px] -z-10 rounded-[14px] bg-[#c8ff5a] transition group-hover:bg-[#d8ff89]" />
          <motion.span
            className="absolute inset-y-0 z-0 w-20 -skew-x-12 bg-gradient-to-r from-transparent via-white/55 to-transparent"
            initial={{ x: -120 }}
            animate={{ x: 430 }}
            transition={{ duration: 1.15, repeat: Infinity, repeatDelay: 2.4, ease: "easeInOut" }}
          />
          <motion.span
            className="absolute left-2 top-2 size-1.5 rounded-full bg-white shadow-[0_0_10px_3px_rgba(255,255,255,.95)]"
            animate={{ opacity: [0, 1, 0], scale: [0.4, 1.35, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.1 }}
          />
          <motion.span
            className="absolute bottom-2 right-3 size-1 rounded-full bg-white shadow-[0_0_9px_3px_rgba(255,255,255,.9)]"
            animate={{ opacity: [0, 1, 0], scale: [0.4, 1.5, 0.4] }}
            transition={{ duration: 1.25, repeat: Infinity, repeatDelay: 1.5, delay: .7 }}
          />
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-2xl"
            animate={{ boxShadow: ["0 0 0 0 rgba(200,255,90,.15)", "0 0 0 7px rgba(200,255,90,.12)", "0 0 0 0 rgba(200,255,90,0)"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
        </>
      ) : <span className="absolute inset-[2px] -z-10 rounded-[14px] bg-[#c8ff5a]" />}
      <span className="relative flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#09130f] text-[#c8ff5a]">
          <TicketPercent className="size-5" />
        </span>
        <span className="text-left">
          <span className="block text-sm font-black leading-tight sm:text-base">Comprá ahora por {price}</span>
          <span className="mt-1 block h-4 overflow-hidden text-[10px] font-extrabold uppercase tracking-[.08em] text-emerald-950/70">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={messageIndex}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
                className="block"
              >
                {messages[messageIndex]}
              </motion.span>
            </AnimatePresence>
          </span>
        </span>
      </span>
      <ArrowRight className="relative ml-3 size-5 shrink-0 transition group-hover:translate-x-1" />
    </a>
  );
}
