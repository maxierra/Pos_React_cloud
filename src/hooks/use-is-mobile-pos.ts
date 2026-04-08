"use client";

import * as React from "react";

const QUERY = "(max-width: 1023px)";

/**
 * Vista POS móvil (sin grilla de productos): coincide con breakpoint `lg` del layout.
 */
export function useIsMobilePos() {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const apply = () => setMatches(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return matches;
}
