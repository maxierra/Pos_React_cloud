import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
import { SupportFloatingButton } from "@/components/support-floating-button";

export const metadata: Metadata = {
  metadataBase: new URL("https://tienda360.site"),
  title: "Tienda360 | Software de Gestión y Punto de Venta para Windows",
  description:
    "Sistema de gestión para comercios en Windows. Controlá ventas, stock y caja. Más de 300.000 productos precargados. Pago único y sin mensualidades.",
  openGraph: {
    title: "Tienda360 | Software de gestión para PC Windows",
    description: "Controlá ventas, stock y caja. Pago único, sin mensualidades y licencia de por vida.",
    type: "website",
    locale: "es_AR",
    images: [{ url: "/newlogo.jpeg", alt: "Tienda360 para Windows" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tienda360 | Software de gestión para PC Windows",
    description: "Controlá ventas, stock y caja. Pago único y licencia de por vida.",
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
