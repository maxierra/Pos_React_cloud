export const SCHEDULE_CONFIG = { timezone: "America/Argentina/Buenos_Aires", startHour: 10, endHour: 18, slotMinutes: 60, weekdays: [1, 2, 3, 4, 5] } as const;

export function isValidScheduleSlot(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):00-03:00$/.exec(value);
  if (!match) return false;
  const [, y, m, d, hh, mm] = match;
  const local = new Date(`${y}-${m}-${d}T${hh}:${mm}:00-03:00`);
  const hour = Number(hh);
  return !Number.isNaN(local.getTime()) && SCHEDULE_CONFIG.weekdays.includes(local.getDay() as 1 | 2 | 3 | 4 | 5)
    && hour >= SCHEDULE_CONFIG.startHour && hour < SCHEDULE_CONFIG.endHour && Number(mm) === 0 && local.getTime() > Date.now();
}

