import type Quill from "quill";

/** Resolves the document index of an image embed from its DOM wrapper or image src. */
export function resolveImageEmbedIndexFromNode(
  quill: Quill,
  node: HTMLElement,
): number | null {
  const ctor = quill.constructor as {
    find?: (target: Node, bubble?: boolean) => unknown;
  };
  if (typeof ctor.find === "function") {
    const blot = ctor.find(node, false);
    if (blot) {
      return quill.getIndex(blot as never);
    }
  }

  const img = node.querySelector("img");
  const src = img?.getAttribute("src") ?? node.dataset.mediaUrl;
  if (!src) {
    return null;
  }

  const contents = quill.getContents();
  let index = 0;
  for (const op of contents.ops ?? []) {
    const insert = op.insert;
    if (insert && typeof insert === "object" && "image" in insert) {
      if (insert.image === src) {
        return index;
      }
      index += 1;
      continue;
    }
    if (typeof insert === "string") {
      index += insert.length;
      continue;
    }
    index += 1;
  }

  return null;
}
