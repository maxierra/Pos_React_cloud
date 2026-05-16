import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel | SaaS",
  description: "Panel de administración exclusivo de plataforma.",
};

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
