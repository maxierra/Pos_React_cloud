import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://tienda360.site"),
  title: "Tienda360 | Punto de venta para Windows",
  description:
    "Comprá Tienda360 para Windows con licencia definitiva, instalación incluida y sin abono mensual.",
  applicationName: "Tienda360",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tienda360",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
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

export const viewport: Viewport = {
  themeColor: "#0f46c8",
  colorScheme: "light dark",
  viewportFit: "cover",
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
      </body>
    </html>
  );
}
