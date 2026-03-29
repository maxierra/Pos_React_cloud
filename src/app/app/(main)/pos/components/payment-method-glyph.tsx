"use client";

import {
  Banknote,
  Bitcoin,
  Building2,
  CircleDollarSign,
  CreditCard,
  Gift,
  Landmark,
  type LucideIcon,
  QrCode,
  Smartphone,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";

const MAP: Record<string, LucideIcon> = {
  banknote: Banknote,
  "credit-card": CreditCard,
  landmark: Landmark,
  wallet: Wallet,
  smartphone: Smartphone,
  "qr-code": QrCode,
  "circle-dollar-sign": CircleDollarSign,
  bitcoin: Bitcoin,
  gift: Gift,
  "building-2": Building2,
};

type Props = {
  iconKey: string;
  iconUrl?: string | null;
  className?: string;
  imgClassName?: string;
};

export function PaymentMethodGlyph({ iconKey, iconUrl, className, imgClassName }: Props) {
  const url = (iconUrl ?? "").trim();
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={cn("size-4 shrink-0 object-contain sm:size-[18px]", imgClassName)}
        loading="lazy"
      />
    );
  }
  const Icon = MAP[iconKey] ?? Banknote;
  return <Icon className={cn("size-4 shrink-0 sm:size-[18px]", className)} />;
}
