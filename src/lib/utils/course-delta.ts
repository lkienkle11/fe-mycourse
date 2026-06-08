export type DeltaOp = {
  insert: string | { image: string };
  attributes?: Record<string, unknown>;
};

export type DeltaShape = {
  ops: DeltaOp[];
};

function hasImageInsert(
  op: DeltaOp,
): op is DeltaOp & { insert: { image: string } } {
  return (
    typeof op.insert === "object" && op.insert != null && "image" in op.insert
  );
}

export function createEmptyDelta(): DeltaShape {
  return { ops: [{ insert: "" }] };
}

export function createEmptyDeltaString(): string {
  return stringifyDelta(createEmptyDelta());
}

export function parseDelta(value: string): DeltaShape {
  try {
    const parsed = JSON.parse(value) as DeltaShape;
    if (parsed && Array.isArray(parsed.ops)) {
      return parsed;
    }
  } catch {}

  return createEmptyDelta();
}

export function stringifyDelta(delta: DeltaShape): string {
  return JSON.stringify(delta, null, 2);
}

export function extractPlainText(delta: DeltaShape): string {
  return delta.ops
    .map((op) => (typeof op.insert === "string" ? op.insert : ""))
    .join("");
}

export function extractImages(delta: DeltaShape): string[] {
  return delta.ops
    .map((op) => (hasImageInsert(op) ? op.insert.image : ""))
    .filter(Boolean);
}

export function extractImageOps(delta: DeltaShape): DeltaOp[] {
  return delta.ops.filter(hasImageInsert);
}

export function normalizeSafeLink(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}
