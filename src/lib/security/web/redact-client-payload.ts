/**
 * Allow-list / DTO projection for client-bound props.
 * Mirrors fetch-error allow-list discipline — never blind key deletion.
 */

export type RedactAllowList<T extends object> = readonly (keyof T & string)[];

/**
 * Project `source` onto `allowList` keys only.
 * Missing keys are omitted; values are shallow-copied.
 */
export function redactClientPayload<T extends object>(
  source: T,
  allowList: RedactAllowList<T>,
): Partial<T> {
  const out: Partial<T> = {};
  for (const key of allowList) {
    if (Object.hasOwn(source, key)) {
      out[key] = source[key];
    }
  }
  return out;
}

/**
 * Nested allow-list map: top-level key → child allow list (or true to keep whole value).
 */
export type NestedRedactSchema<T extends object> = {
  readonly [K in keyof T]?: T[K] extends object
    ? RedactAllowList<T[K] & object> | true
    : true;
};

export function redactClientPayloadNested<T extends object>(
  source: T,
  schema: NestedRedactSchema<T>,
): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(schema) as (keyof T & string)[]) {
    const rule = schema[key];
    if (rule === undefined || !Object.hasOwn(source, key)) continue;
    const value = source[key];
    if (rule === true) {
      out[key] = value;
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = redactClientPayload(
        value as T[typeof key] & object,
        rule as RedactAllowList<T[typeof key] & object>,
      ) as T[typeof key];
    }
  }
  return out;
}
