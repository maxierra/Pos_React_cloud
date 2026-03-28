"use client";

import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

type Props = {
  secondaryHref: string;
  secondaryLabel: string;
};

export function AuthSiteHeader({ secondaryHref, secondaryLabel }: Props) {
  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-white/10 bg-black/35 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
          <span className="size-2 rounded-full bg-fuchsia-400 shadow-[0_0_18px_rgba(244,114,182,0.9)]" />
          <span className="text-sm font-semibold tracking-tight text-white">POS SaaS</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href={secondaryHref}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-3 text-[0.8rem] font-medium text-white transition-colors hover:bg-white/20"
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
