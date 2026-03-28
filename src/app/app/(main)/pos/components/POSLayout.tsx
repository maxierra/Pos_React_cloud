"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type Props = {
  header: React.ReactNode;
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
};

export function POSLayout({ header, left, right, className }: Props) {
  return (
    <div
      className={cn(
        "h-[calc(100vh-140px)] bg-[var(--pos-bg)] text-foreground",
        className
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 px-4 py-4">
        <div className="rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface)] p-4 shadow-sm">
          {header}
        </div>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-12">
          <div className="min-h-0 lg:col-span-8">
            <div className="h-full overflow-auto rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface)] p-4 shadow-sm">
              {left}
            </div>
          </div>

          <div className="min-h-0 lg:col-span-4">
            <div className="h-full rounded-2xl border border-[var(--pos-border)] bg-[var(--pos-surface)] shadow-sm">
              {right}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
