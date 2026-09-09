"use client";

import { useEffect } from "react";
import { ConversionLanding } from "./conversion-landing";

export function ConversionLandingGuard() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest<HTMLAnchorElement>('a[href^="/api/download/windows"]');
      if (!link) return;
      event.preventDefault();
      document.querySelector<HTMLButtonElement>(".download-dialog-trigger")?.click();
    };
    document.addEventListener("click", onClick);
    const nav = document.querySelector(".conversion-landing .nav");
    const access = document.createElement("a");
    access.className = "web-access-nav";
    access.href = "/auth/login";
    access.textContent = "Acceder al sistema web";
    nav?.appendChild(access);
    return () => { document.removeEventListener("click", onClick); access.remove(); };
  }, []);

  return <ConversionLanding />;
}
