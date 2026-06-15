/**
 * Duration helpers for curriculum estimated_duration_ms (milliseconds).
 * Display-only H/M/S conversion; API always uses ms.
 * Unit suffixes must come from i18n (`course.common.durationUnit*`) via buildDurationUnits.
 */

export type DurationUnits = {
  h: string;
  m: string;
  s: string;
};

const MAX_DURATION_MS = 999 * 3600 * 1000;

/** Build unit suffixes from `useTranslations("course.common")`. */
export function buildDurationUnits(
  t: (
    key: "durationUnitHours" | "durationUnitMinutes" | "durationUnitSeconds",
  ) => string,
): DurationUnits {
  return {
    h: t("durationUnitHours"),
    m: t("durationUnitMinutes"),
    s: t("durationUnitSeconds"),
  };
}

export function parseDurationPartsToMs(
  hours: number,
  minutes: number,
  seconds: number,
): number {
  const h = Number.isFinite(hours) ? Math.max(0, Math.floor(hours)) : 0;
  const m = Number.isFinite(minutes) ? Math.max(0, Math.floor(minutes)) : 0;
  const s = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return ((h * 60 + m) * 60 + s) * 1000;
}

export function splitMsToDurationParts(ms: number): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const totalSeconds = Math.max(
    0,
    Math.floor((Number.isFinite(ms) ? ms : 0) / 1000),
  );
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
}

/** Omits zero parts; returns empty string when total is 0. */
export function formatDurationMs(ms: number, units: DurationUnits): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "";
  }
  const { hours, minutes, seconds } = splitMsToDurationParts(ms);
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours}${units.h}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}${units.m}`);
  }
  if (seconds > 0) {
    parts.push(`${seconds}${units.s}`);
  }
  return parts.join("");
}

export function isDurationWithinMaxMs(ms: number): boolean {
  return Number.isFinite(ms) && ms >= 0 && ms <= MAX_DURATION_MS;
}

export { MAX_DURATION_MS };
