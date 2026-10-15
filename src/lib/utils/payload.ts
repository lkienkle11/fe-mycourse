/**
 * Optional write-payload fields: decide only whether a key is *present*.
 * What an omitted key means to the backend (create: generate, update: keep)
 * stays with the caller.
 */

/** Value unchanged when it has non-whitespace content, otherwise `undefined`. */
export function omitWhenBlank(
  value: string | null | undefined,
): string | undefined {
  return value && value.trim() !== "" ? value : undefined;
}

/**
 * Trimmed value when it is non-blank and different from `persisted`,
 * otherwise `undefined`. Create semantics: `persisted` defaults to `""`.
 */
export function changedNonBlank(
  value: string,
  persisted = "",
): string | undefined {
  const trimmed = value.trim();
  return trimmed !== "" && trimmed !== persisted ? trimmed : undefined;
}

/** `{ [key]: value }` when defined, else `{}`; spread into a payload literal. */
export function payloadField<K extends string>(
  key: K,
  value: string | undefined,
): { [P in K]?: string } {
  return value === undefined ? {} : ({ [key]: value } as { [P in K]?: string });
}
