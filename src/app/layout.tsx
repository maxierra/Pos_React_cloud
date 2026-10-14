import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
import { SupportFloatingButton } from "@/components/support-floating-button";

export const metadata: Metadata = {
  metadataBase: new URL("https://tienda360.site"),
  title: "Tienda360 | Punto de venta para Windows",
  description:
    "Comprá Tienda360 para Windows con licencia definitiva, instalación incluida y sin abono mensual.",
  openGraph: {
    title: "Tienda360: tu punto de venta listo en minutos",
    description: "Licencia definitiva para Windows. Ventas, stock, caja, clientes y reportes en un solo lugar.",
    type: "website",
    locale: "es_AR",
    images: [{ url: "/newlogo.jpeg", alt: "Tienda360 para Windows" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tienda360: punto de venta para Windows",
    description: "Compralo una vez y usalo sin abono mensual.",
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
