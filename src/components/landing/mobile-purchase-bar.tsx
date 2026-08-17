"use client";

import * as React from "react";

import { SoftwarePurchaseModal } from "@/components/landing/software-purchase-modal";

type Props = {
  listAmount: number;
  promoCode: string;
  discountPercent: number;
  promoAmount: number;
  price: string;
};

export function MobilePurchaseBar(props: Props) {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const targets = Array.from(document.querySelectorAll("[data-primary-purchase='true']"));
    const visible = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
        setShow(visible.size === 0);
      },
      { threshold: 0.35 }
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-slate-200 bg-white/95 p-2 pb-[max(.5rem,env(safe-area-inset-bottom))] shadow-[0_-12px_30px_-20px_rgba(15,23,42,.6)] backdrop-blur md:hidden">
      <SoftwarePurchaseModal
        {...props}
        triggerLabel={`Tienda360 ${props.price} — Comprar`}
        triggerClassName="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#c8ff5a] px-4 text-sm font-black text-[#09130f]"
      />
    </div>
  );
}
