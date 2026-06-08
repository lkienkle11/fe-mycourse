export function formatUnixDateTime(
  unixSeconds: number | undefined,
  locale?: string,
): string {
  if (!unixSeconds) {
    return "—";
  }

  return new Date(unixSeconds * 1000).toLocaleString(locale);
}
