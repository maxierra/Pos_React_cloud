"use client";

import * as React from "react";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme-provider";

export function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      {children}
      <Toaster richColors theme="dark" />
    </ThemeProvider>
  );
}
