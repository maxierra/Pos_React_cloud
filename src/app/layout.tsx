import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
import { SupportFloatingButton } from "@/components/support-floating-button";

export const metadata: Metadata = {
  title: "Tienda360 POS | Punto de venta para comercios",
  description:
    "Vendé más rápido y controlá stock, caja y reportes con Tienda360 POS. Software para Windows con licencia de por vida y soporte cercano.",
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
