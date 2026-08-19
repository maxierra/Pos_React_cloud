"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

import { trackMetaCustomEvent, type MetaCustomEvent } from "@/components/analytics/meta-pixel";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { event: MetaCustomEvent; children: ReactNode };

export function MetaTrackedLink({ event, children, onClick, ...props }: Props) {
  return (
    <a {...props} onClick={(clickEvent) => {
      trackMetaCustomEvent(event, { location: props.href ?? "landing" });
      onClick?.(clickEvent);
    }}>
      {children}
    </a>
  );
}
