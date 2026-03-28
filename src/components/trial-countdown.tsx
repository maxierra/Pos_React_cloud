"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { formatTrialRemainingCompact, formatTrialRemainingSentence, getTrialRemaining } from "@/lib/trial-remaining";

type Props = {
  endsAt: string;
  variant: "large" | "compact";
  className?: string;
};

const CELL_STYLES = [
  "border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 to-teal-500/5 text-emerald-700 dark:border-emerald-400/20 dark:from-emerald-400/10 dark:to-teal-500/5 dark:text-emerald-300",
  "border-sky-500/25 bg-gradient-to-br from-sky-500/15 to-cyan-500/5 text-sky-800 dark:border-sky-400/20 dark:from-sky-400/10 dark:to-cyan-500/5 dark:text-sky-200",
  "border-violet-500/25 bg-gradient-to-br from-violet-500/12 to-fuchsia-500/5 text-violet-800 dark:border-violet-400/20 dark:from-violet-400/10 dark:to-fuchsia-500/5 dark:text-violet-200",
  "border-amber-500/30 bg-gradient-to-br from-amber-500/15 to-orange-500/5 text-amber-900 dark:border-amber-400/25 dark:from-amber-400/10 dark:to-orange-500/5 dark:text-amber-200",
] as const;

export function TrialCountdown({ endsAt, variant, className }: Props) {
  const [, setTick] = React.useState(0);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!isMounted) {
    return (
      <div className={cn("animate-pulse space-y-4", className)}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted/20" />
          ))}
        </div>
      </div>
    );
  }

  const parts = getTrialRemaining(endsAt);

  if (variant === "compact") {
    return (
      <span
        className={cn(
          "font-semibold tabular-nums text-[var(--pos-accent)] dark:text-[var(--pos-accent)]",
          className
        )}
        title={formatTrialRemainingSentence(parts)}
      >
        {formatTrialRemainingCompact(parts)}
      </span>
    );
  }

  if (parts.expired) {
    return (
      <div
        className={cn(
          "rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive",
          className
        )}
      >
        La prueba gratuita finalizó. Activá el plan abajo para seguir usando la app.
      </div>
    );
  }

  const cells = [
    { label: "Días", value: parts.days },
    { label: "Horas", value: parts.hours },
    { label: "Min", value: parts.minutes },
    { label: "Seg", value: parts.seconds },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cells.map((c, i) => (
          <div
            key={c.label}
            className={cn(
              "rounded-2xl border px-3 py-4 text-center shadow-sm backdrop-blur-sm transition-transform duration-300 hover:scale-[1.02]",
              CELL_STYLES[i % CELL_STYLES.length]
            )}
          >
            <div className="text-3xl font-bold tabular-nums tracking-tight text-foreground dark:text-white">{c.value}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-80">{c.label}</div>
          </div>
        ))}
      </div>
      <p className="rounded-xl border border-[var(--pos-border)] bg-[var(--pos-surface-2)]/80 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Resumen: </span>
        {formatTrialRemainingSentence(parts)}
      </p>
    </div>
  );
}
