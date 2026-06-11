import type { MediaEmbedKind } from "./media";

export type DeltaInsert = string | { image: string } | { video: string };

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

export function parseDelta(value: string): DeltaShape {
  try {
    const parsed = JSON.parse(value) as DeltaShape;
    if (parsed && Array.isArray(parsed.ops)) {
      return parsed;
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
    const parsed = JSON.parse(trimmed) as DeltaShape;
    if (parsed && Array.isArray(parsed.ops)) {
      return parsed;
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
    .map((op) => (typeof op.insert === "string" ? op.insert : ""))
    .join("");
}

function isMediaEmbedOp(op: DeltaOp): op is DeltaOp & {
  insert: { image: string } | { video: string };
} {
  return (
    typeof op.insert === "object" &&
    op.insert != null &&
    ("image" in op.insert || "video" in op.insert)
  );
}

function mediaEmbedFromOp(op: DeltaOp): DeltaMediaEmbed | null {
  if (!isMediaEmbedOp(op)) {
    return null;
  }
  if ("image" in op.insert) {
    return { kind: "image", url: op.insert.image };
  }
  return { kind: "video", url: op.insert.video };
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
    const parsed = JSON.parse(trimmed) as DeltaShape;
    if (parsed && Array.isArray(parsed.ops)) {
      return countNonWhitespace(extractPlainText(parsed));
    }
  } catch {}

  return countNonWhitespace(trimmed);
}
