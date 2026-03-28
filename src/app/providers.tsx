"use client";

import * as React from "react";
import { Toaster } from "sonner";

import { ThemeProvider, useTheme } from "@/components/theme-provider";

function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster richColors theme={theme} />;
}

export function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      {children}
      <ThemedToaster />
    </ThemeProvider>
  );
}
