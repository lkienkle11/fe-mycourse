/** Count Unicode code points (same unit as Go `utf8.RuneCountInString`). */
export function unicodeCodePointLength(value: string): number {
  return Array.from(value).length;
}

/** Truncate to at most `max` Unicode code points. */
export function truncateUnicodeCodePoints(value: string, max: number): string {
  if (max < 0) return "";
  const points = Array.from(value);
  if (points.length <= max) return value;
  return points.slice(0, max).join("");
}
