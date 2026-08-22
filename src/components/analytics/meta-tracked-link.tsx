"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

import { trackMetaCustomEvent, type MetaCustomEvent } from "@/components/analytics/meta-pixel";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  event: MetaCustomEvent;
  eventParams?: Record<string, string | number | boolean | string[]>;
  children: ReactNode;
};

export function MetaTrackedLink({ event, eventParams, children, onClick, ...props }: Props) {
  return (
    <a {...props} onClick={(clickEvent) => {
      trackMetaCustomEvent(event, { location: props.href ?? "landing", ...eventParams });
      onClick?.(clickEvent);
    }}>
      {children}
    </a>
  );
}
