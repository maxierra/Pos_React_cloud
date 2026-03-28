import { parseDbTimestamptzMs } from "@/lib/parse-db-timestamp";

export type TrialRemainingParts = {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

/** Tiempo restante hasta periodEnd. El instante final se parsea como UTC (timestamptz). */
export function getTrialRemaining(periodEndIso: string, nowMs = Date.now()): TrialRemainingParts {
  const end = parseDbTimestamptzMs(periodEndIso);
  if (end == null) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const totalMs = end - nowMs;
  if (totalMs <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const totalSec = Math.floor(totalMs / 1000);
  return {
    expired: false,
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  };
}

export function formatTrialRemainingSentence(parts: TrialRemainingParts): string {
  if (parts.expired) return "La prueba ya finalizó.";
  const { days, hours, minutes, seconds } = parts;
  if (days === 0 && hours === 0 && minutes === 0) {
    return `Te quedan ${seconds} ${seconds === 1 ? "segundo" : "segundos"} de prueba gratis.`;
  }
  const chunks: string[] = [];
  if (days > 0) chunks.push(`${days} ${days === 1 ? "día" : "días"}`);
  if (hours > 0 || days > 0) chunks.push(`${hours} ${hours === 1 ? "hora" : "horas"}`);
  chunks.push(`${minutes} ${minutes === 1 ? "minuto" : "minutos"}`);
  return `Te quedan ${chunks.join(", ")} de prueba gratis.`;
}

export function formatTrialRemainingCompact(parts: TrialRemainingParts): string {
  if (parts.expired) return "Prueba vencida";
  const { days, hours, minutes } = parts;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
