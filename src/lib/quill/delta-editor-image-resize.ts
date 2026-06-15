import type Quill from "quill";

const MEDIA_EMBED_WRAPPER_CLASS = "ql-media-embed";
export const IMAGE_RESIZE_HANDLE_CLASS = "ql-image-resize-handle";

type ImageResizeCorner = "nw" | "ne" | "sw" | "se";

export function createImageResizeHandle(
  corner: ImageResizeCorner,
): HTMLSpanElement {
  const handle = document.createElement("span");
  handle.className = IMAGE_RESIZE_HANDLE_CLASS;
  handle.dataset.corner = corner;
  handle.setAttribute("aria-hidden", "true");
  handle.title = "Resize image";
  return handle;
}

export function appendImageResizeHandles(node: HTMLElement): void {
  for (const corner of ["nw", "ne", "sw", "se"] as const) {
    node.appendChild(createImageResizeHandle(corner));
  }
}

function resolveImageEmbedIndexFromNode(
  quill: Quill,
  wrapper: HTMLElement,
): number | null {
  const ctor = quill.constructor as {
    find?: (target: Node, bubble?: boolean) => unknown;
  };
  if (typeof ctor.find === "function") {
    const blot = ctor.find(wrapper, false);
    if (blot) {
      return quill.getIndex(blot as never);
    }
  }

  const img = wrapper.querySelector("img");
  const src = img?.getAttribute("src") ?? wrapper.dataset.mediaUrl;
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

export function bindQuillImageResize(quill: Quill): () => void {
  let dragState: {
    index: number;
    corner: ImageResizeCorner;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null = null;

  const computeSize = (
    corner: ImageResizeCorner,
    dx: number,
    dy: number,
    startWidth: number,
    startHeight: number,
  ) => {
    let width = startWidth;
    let height = startHeight;

    switch (corner) {
      case "se":
        width += dx;
        height += dy;
        break;
      case "sw":
        width -= dx;
        height += dy;
        break;
      case "ne":
        width += dx;
        height -= dy;
        break;
      case "nw":
        width -= dx;
        height -= dy;
        break;
    }

    return {
      width: Math.max(48, Math.round(width)),
      height: Math.max(48, Math.round(height)),
    };
  };

  const endDrag = (event: PointerEvent) => {
    if (!dragState) {
      return;
    }
    if (event.target instanceof HTMLElement) {
      event.target.releasePointerCapture?.(event.pointerId);
    }
    dragState = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!dragState) {
      return;
    }

    const { width, height } = computeSize(
      dragState.corner,
      event.clientX - dragState.startX,
      event.clientY - dragState.startY,
      dragState.startWidth,
      dragState.startHeight,
    );

    quill.formatText(
      dragState.index,
      1,
      {
        width: `${width}px`,
        height: `${height}px`,
      },
      "api",
    );
  };

  const onPointerDown = (event: PointerEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (!target.classList.contains(IMAGE_RESIZE_HANDLE_CLASS)) {
      return;
    }

    const corner = target.dataset.corner as ImageResizeCorner | undefined;
    if (!corner) {
      return;
    }

    const wrapper = target.closest(`.${MEDIA_EMBED_WRAPPER_CLASS}.ql-image`);
    if (!(wrapper instanceof HTMLElement)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const index = resolveImageEmbedIndexFromNode(quill, wrapper);
    if (index == null) {
      return;
    }

    const img = wrapper.querySelector("img");
    if (!(img instanceof HTMLImageElement)) {
      return;
    }

    const rect = img.getBoundingClientRect();
    dragState = {
      index,
      corner,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
    };
    try {
      target.setPointerCapture(event.pointerId);
    } catch {
      // Ignore when pointer id is not active (e.g. synthetic events).
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  };

  quill.root.addEventListener("pointerdown", onPointerDown, true);

  return () => {
    quill.root.removeEventListener("pointerdown", onPointerDown, true);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
  };
}
