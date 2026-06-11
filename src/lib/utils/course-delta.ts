export type DeltaInsert = string | { image: string } | { video: string };

export type DeltaOp = {
  insert: DeltaInsert;
  attributes?: Record<string, unknown>;
};

export type DeltaShape = {
  ops: DeltaOp[];
};

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
  return JSON.stringify(delta);
}

export function extractPlainText(delta: DeltaShape): string {
  return delta.ops
    .map((op) => (typeof op.insert === "string" ? op.insert : ""))
    .join("");
}

function isMediaEmbedOp(op: DeltaOp): boolean {
  return (
    typeof op.insert === "object" &&
    op.insert != null &&
    ("image" in op.insert || "video" in op.insert)
  );
}

/** Remove image/video embed ops (text inserts only). */
export function stripMediaEmbedsFromDelta(delta: DeltaShape): DeltaShape {
  const ops = delta.ops.filter((op) => !isMediaEmbedOp(op));
  return ops.length > 0 ? { ops } : createEmptyDelta();
}

/** Count visible characters ignoring whitespace (matches BE text rules). */
export function countNonWhitespace(value: string): number {
  let count = 0;
  for (const char of value.trim()) {
    if (!/\s/u.test(char)) {
      count += 1;
    }
  }
  return count;
}

/** Count non-whitespace text inside Quill Delta JSON string inserts. */
export function countDeltaNonWhitespace(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) {
    return 0;
  }
  try {
    const delta = parseDelta(trimmed);
    return countNonWhitespace(extractPlainText(delta));
  } catch {
    return countNonWhitespace(trimmed);
  }
}
