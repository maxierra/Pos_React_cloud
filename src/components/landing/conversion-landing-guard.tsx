"use client";

import { useEffect } from "react";
import { ConversionLanding } from "./conversion-landing";

export function ConversionLandingGuard() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest<HTMLAnchorElement>('a[href^="/api/download/windows"]');
      if (!link) return;
      const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
      if (mobile) {
        event.preventDefault();
        window.alert("La descarga solo está disponible desde una PC con Windows. Desde el celular podés dejar tus datos o acceder al sistema web.");
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return <><a className="web-access-floating" href="/auth/login">Acceder al sistema web</a><ConversionLanding /></>;
}
