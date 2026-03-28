"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

import type { DemoChrome } from "@/components/landing/demo-chrome";
import { cn } from "@/lib/utils";

type Props = {
  targetText: string;
  placeholder?: string;
  chrome: DemoChrome;
};

export function AnimatedSearchInput({
  targetText,
  placeholder = "Buscar por nombre o codigo...",
  chrome,
}: Props) {
  const [typed, setTyped] = useState("");

  const letters = useMemo(() => targetText.split(""), [targetText]);

  useEffect(() => {
    setTyped("");
    if (!targetText) return;

    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setTyped(letters.slice(0, i).join(""));
      if (i >= letters.length) clearInterval(timer);
    }, 55);

    return () => clearInterval(timer);
  }, [letters, targetText]);

  return (
    <div className="relative">
      <Search
        className={cn("pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2", chrome.muted)}
      />
      <div
        className={cn(
          "h-11 rounded-xl border pl-10 pr-3 text-sm",
          chrome.searchField
        )}
      >
        <div className="flex h-full items-center gap-0.5">
          <span className={typed ? "" : chrome.muted}>{typed || placeholder}</span>
          <motion.span
            animate={{ opacity: [0.15, 1, 0.15] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
            className={cn("inline-block h-4 w-[2px] rounded-full", chrome.searchCursor)}
          />
        </div>
      </div>
    </div>
  );
}
