"use client";

import Script from "next/script";

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "3436082476553759";

type MetaEventParams = Record<string, string | number | boolean | string[]>;

export type MetaStandardEvent = "ViewContent" | "InitiateCheckout" | "Lead" | "Purchase";
export type MetaCustomEvent =
  | "ClickComprar"
  | "ClickDemo"
  | "ClickWhatsApp"
  | "FormularioIniciado"
  | "FormularioCompletado";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export function trackMetaEvent(
  event: MetaStandardEvent,
  params?: MetaEventParams,
  eventId?: string
) {
  if (typeof window === "undefined" || !window.fbq) return;
  if (eventId) {
    window.fbq("track", event, params ?? {}, { eventID: eventId });
    return;
  }
  window.fbq("track", event, params ?? {});
}

export function trackMetaCustomEvent(event: MetaCustomEvent, params?: MetaEventParams) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("trackCustom", event, params ?? {});
}

export function readMetaCookie(name: "_fbp" | "_fbc") {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  const value = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return value ? decodeURIComponent(value.slice(prefix.length)) : undefined;
}

type MetaPixelProps = {
  trackViewContent?: boolean;
  contentName?: string;
  contentId?: string;
  value?: number;
};

export function MetaPixel({
  trackViewContent = true,
  contentName = "Combo Punto de Venta Tienda360",
  contentId = "combo_essential",
  value = 250000,
}: MetaPixelProps = {}) {
  const viewContent = trackViewContent
    ? `fbq('track','ViewContent',${JSON.stringify({ content_name: contentName, content_ids: [contentId], content_type: "product", value, currency: "ARS" })});`
    : "";
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('set','autoConfig',false,'${META_PIXEL_ID}');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');${viewContent}`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
