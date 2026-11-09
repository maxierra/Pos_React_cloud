"use client";

import Link from "next/link";

type Props = {
  secondaryHref: string;
  secondaryLabel: string;
};

export function AuthSiteHeader({ secondaryHref, secondaryLabel }: Props) {
  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-cyan-300/15 bg-[#071326]/75 text-white shadow-[0_12px_35px_-24px_rgba(34,211,238,.55)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
          <span className="size-2 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,.85)]" />
          <span className="text-sm font-semibold tracking-tight text-white">Tienda360 · POS SaaS</span>
        </Link>
        <Link
          href={secondaryHref}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-50 shadow-[0_8px_22px_-12px_rgba(34,211,238,.7)] transition-colors hover:bg-cyan-300/20"
        >
          {secondaryLabel}
        </Link>
      </div>
    </header>
  );
}
