import type { MediaEmbedKind } from "./media";
import { unicodeCodePointLength } from "./unicode-length";

export type DeltaInsert =
  | string
  | { image: string }
  | { video: string }
  | { document: string };

export type DeltaMediaEmbed = {
  kind: MediaEmbedKind;
  url: string;
};

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

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function attributesFromRaw(
  raw: Record<string, unknown>,
): Record<string, unknown> | undefined {
  return isPlainRecord(raw.attributes) ? raw.attributes : undefined;
}

/**
 * Keep only ops Quill / helpers can safely consume. Drops `null`, numbers,
 * empty objects, and unknown embed shapes that older BE counters skipped.
 */
function normalizeDeltaOp(raw: unknown): DeltaOp | null {
  if (!isPlainRecord(raw) || !("insert" in raw)) {
    return null;
  }

  const insert = raw.insert;
  const attributes = attributesFromRaw(raw);

  if (typeof insert === "string") {
    return attributes ? { insert, attributes } : { insert };
  }

  if (!isPlainRecord(insert)) {
    return null;
  }

  if (typeof insert.image === "string") {
    const next: DeltaOp = { insert: { image: insert.image } };
    if (attributes) next.attributes = attributes;
    return next;
  }
  if (typeof insert.video === "string") {
    const next: DeltaOp = { insert: { video: insert.video } };
    if (attributes) next.attributes = attributes;
    return next;
  }
  if (typeof insert.document === "string") {
    const next: DeltaOp = { insert: { document: insert.document } };
    if (attributes) next.attributes = attributes;
    return next;
  }

  return null;
}

function normalizeDeltaOps(ops: unknown[]): DeltaOp[] {
  const normalized: DeltaOp[] = [];
  for (const op of ops) {
    const next = normalizeDeltaOp(op);
    if (next) {
      normalized.push(next);
    }
  }
  return normalized.length > 0 ? normalized : [{ insert: "" }];
}

export function parseDelta(value: string): DeltaShape {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (isPlainRecord(parsed) && Array.isArray(parsed.ops)) {
      return { ops: normalizeDeltaOps(parsed.ops) };
    }
  } catch {}

  return createEmptyDelta();
}

/** Parse Delta JSON or wrap legacy plain-text values (matches BE CountDeltaNonWhitespace). */
export function coerceToDelta(value: string): DeltaShape {
  const trimmed = value.trim();
  if (!trimmed) {
    return createEmptyDelta();
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (isPlainRecord(parsed) && Array.isArray(parsed.ops)) {
      return { ops: normalizeDeltaOps(parsed.ops) };
    }
  } catch {}

  return { ops: [{ insert: trimmed }] };
}

/** Plain-text preview for outline cards (Delta JSON or legacy plain text). */
export function extractDeltaPreviewText(value: string): string {
  return extractPlainText(coerceToDelta(value)).trim();
}

export function stringifyDelta(delta: DeltaShape): string {
  return JSON.stringify(delta);
}

export function extractPlainText(delta: DeltaShape): string {
  return delta.ops
    .map((op) =>
      op != null && typeof op === "object" && typeof op.insert === "string"
        ? op.insert
        : "",
    )
    .join("");
}

function isMediaEmbedOp(op: DeltaOp | null | undefined): op is DeltaOp & {
  insert: { image: string } | { video: string } | { document: string };
} {
  if (op == null || typeof op !== "object") {
    return false;
  }
  return (
    typeof op.insert === "object" &&
    op.insert != null &&
    ("image" in op.insert || "video" in op.insert || "document" in op.insert)
  );
}

function mediaEmbedFromOp(op: DeltaOp): DeltaMediaEmbed | null {
  if (!isMediaEmbedOp(op)) {
    return null;
  }
  if ("image" in op.insert) {
    return { kind: "image", url: op.insert.image };
  }
  if ("video" in op.insert) {
    return { kind: "video", url: op.insert.video };
  }
  return { kind: "document", url: op.insert.document };
}

/** Lists image/video embeds in Delta op order. */
export function extractMediaEmbedsFromDelta(
  delta: DeltaShape,
): DeltaMediaEmbed[] {
  return delta.ops.flatMap((op) => {
    const embed = mediaEmbedFromOp(op);
    return embed ? [embed] : [];
  });
}

/** Embeds present in `previous` but not in `next` (multiset — duplicate URLs counted). */
export function diffRemovedMediaEmbeds(
  previous: readonly DeltaMediaEmbed[],
  next: readonly DeltaMediaEmbed[],
): DeltaMediaEmbed[] {
  const remaining = [...next];
  const removed: DeltaMediaEmbed[] = [];

  for (const embed of previous) {
    const index = remaining.findIndex(
      (candidate) =>
        candidate.kind === embed.kind && candidate.url === embed.url,
    );
    if (index === -1) {
      removed.push(embed);
    } else {
      remaining.splice(index, 1);
    }
  }

  return removed;
}

/** Remove image/video/document embed ops (text inserts only). */
export function stripMediaEmbedsFromDelta(delta: DeltaShape): DeltaShape {
  const ops = delta.ops.filter((op) => !isMediaEmbedOp(op));
  return ops.length > 0 ? { ops } : createEmptyDelta();
}

/** Strip named format attributes (e.g. `font`, `size`) from Delta ops. */
export function stripDeltaFormatAttributes(
  delta: DeltaShape,
  keys: readonly string[],
): DeltaShape {
  if (keys.length === 0) {
    return delta;
  }
  const keySet = new Set(keys);
  const ops = delta.ops.map((op) => {
    if (!op?.attributes) {
      return op;
    }
    let changed = false;
    const nextAttrs: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(op.attributes)) {
      if (keySet.has(key)) {
        changed = true;
        continue;
      }
      nextAttrs[key] = value;
    }
    if (!changed) {
      return op;
    }
    if (Object.keys(nextAttrs).length === 0) {
      return { insert: op.insert };
    }
    return { insert: op.insert, attributes: nextAttrs };
  });
  return { ops };
}

/** Keep only embed ops whose kind is in `allowedKinds`. */
export function filterDeltaMediaEmbeds(
  delta: DeltaShape,
  allowedKinds: readonly MediaEmbedKind[],
): DeltaShape {
  const allowed = new Set(allowedKinds);
  const ops = delta.ops.filter((op) => {
    const embed = mediaEmbedFromOp(op);
    if (!embed) {
      return true;
    }
    return allowed.has(embed.kind);
  });
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
  return countNonWhitespace(extractPlainText(coerceToDelta(raw)));
}

/** Count Unicode code points in Delta string inserts (matches BE CountDeltaRunes). */
export function countDeltaCodePoints(raw: string): number {
  return unicodeCodePointLength(extractPlainText(coerceToDelta(raw)));
}

/**
 * Single locked-text policy (instructor bio): attributes stripped everywhere —
 * DeltaEditor normalize, `text-change`, and form hydrate. Mirrors BE
 * validateBioDelta rejects. Keep in sync when the policy changes.
 */
export const TEXT_DELTA_LOCKED_FORMAT_ATTRIBUTES = [
  "font",
  "size",
  "header",
] as const;

/**
 * Canonicalize a stored value for locked-text surfaces: coerce legacy plain
 * text (and drop malformed ops), keep string inserts only, strip locked format
 * attributes. Used on form hydrate so an unedited resubmit never sends
 * pre-policy or crash-causing Delta back to the BE.
 */
export function sanitizeLockedTextDelta(value: string): string {
  const delta = coerceToDelta(value);
  const textOps = delta.ops.filter(
    (op): op is DeltaOp & { insert: string } => typeof op.insert === "string",
  );
  const textOnly: DeltaShape =
    textOps.length > 0 ? { ops: textOps } : createEmptyDelta();
  return stringifyDelta(
    stripDeltaFormatAttributes(textOnly, TEXT_DELTA_LOCKED_FORMAT_ATTRIBUTES),
  );
}
