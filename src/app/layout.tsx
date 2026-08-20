import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
import { SupportFloatingButton } from "@/components/support-floating-button";

export const metadata: Metadata = {
  metadataBase: new URL("https://tienda360.site"),
  title: "Combo Tienda360 | Software + lector + impresora térmica",
  description:
    "Combo completo: Tienda360 con licencia de por vida, lector inalámbrico e impresora térmica. Pago único y envío gratis.",
  openGraph: {
    title: "Combo Tienda360 para tu comercio",
    description: "Software, lector inalámbrico e impresora térmica. Pago único, envío gratis y licencia de por vida.",
    type: "website",
    locale: "es_AR",
    images: [{ url: "/newlogo.jpeg", alt: "Tienda360 para Windows" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Combo Tienda360 para tu comercio",
    description: "Software, lector inalámbrico e impresora térmica. Pago único y envío gratis.",
    images: ["/newlogo.jpeg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className="light h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <SupportFloatingButton />
      </body>
    </html>
  );
}
