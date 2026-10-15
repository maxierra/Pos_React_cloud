"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { trackFunnelEvent, type FunnelEvent } from "@/lib/leads/analytics";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  event: FunnelEvent;
  location: string;
  children: ReactNode;
};

export function TrackedLink({ event, location, children, onClick, ...props }: Props) {
  return (
    <a
      {...props}
      onClick={(click) => {
        trackFunnelEvent(event, { location });
        onClick?.(click);
      }}
    >
      {children}
    </a>
  );
}
