"use client";

import * as React from "react";

import { Barcode, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  inputRef?: React.Ref<HTMLInputElement>;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
};

export function SearchBar({ inputRef, value, onChange, onKeyDown, className, placeholder }: Props) {
  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center gap-2 text-cyan-300">
        <Search className="size-4" />
      </div>

      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? "Buscar por nombre o escanear código de barras..."}
        className={cn(
          "h-10 rounded-xl border border-sky-300/35 bg-[#081a36]/55 pl-10 pr-4 text-sm text-white shadow-inner placeholder:text-blue-100/60 lg:h-12 lg:rounded-2xl lg:pr-24 lg:text-base",
          "focus-visible:border-cyan-300/80 focus-visible:ring-3 focus-visible:ring-cyan-300/20 focus-visible:shadow-[0_0_26px_-8px_rgba(34,211,238,.7)]"
        )}
      />

      <div className="pointer-events-none absolute inset-y-0 right-3 hidden items-center gap-2 lg:flex">
        <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium text-slate-300">
          F2
        </span>
        <div className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300">
          <Barcode className="size-4" />
        </div>
      </div>
    </div>
  );
}
