import type Quill from "quill";
import type { RangeStatic } from "quill";
import { resolveImageEmbedIndexFromNode } from "./delta-editor-image-embed-index";
import { normalizeEmbedLink } from "./delta-editor-link-utils";

const MEDIA_EMBED_WRAPPER_CLASS = "ql-media-embed";
const IMAGE_LINK_CLASS = "ql-image-link";
const IMAGE_LINK_EDIT_CLASS = "ql-image-link-edit";
const CLEAR_LINK_FORMATS = { link: false, linkColor: false } as const;

export type QuillLinkEditRequest = {
  index: number;
  length: number;
  target: "text" | "image";
  currentUrl: string;
};

type LinkHandlerCallbacks = {
  onRequestLinkEdit: (request: QuillLinkEditRequest) => void;
  onLinkNotOnFile: () => void;
  onLinkNoSelection: () => void;
};

function cloneRange(range: RangeStatic): RangeStatic {
  return { index: range.index, length: range.length };
}

function readImageLink(node: HTMLElement): string | undefined {
  const anchor = node.querySelector(`a.${IMAGE_LINK_CLASS}`);
  if (anchor instanceof HTMLAnchorElement && anchor.href) {
    return anchor.href;
  }
  return node.dataset.mediaLink || undefined;
}

function getEmbedKindAtIndex(
  quill: Quill,
  index: number,
): "image" | "video" | "document" | null {
  const [blot] = quill.getLeaf(index);
  const node = blot?.domNode;
  if (node instanceof HTMLElement) {
    const wrapper = node.closest(`.${MEDIA_EMBED_WRAPPER_CLASS}`);
    if (wrapper instanceof HTMLElement) {
      if (wrapper.classList.contains("ql-image")) return "image";
      if (wrapper.classList.contains("ql-video")) return "video";
      if (wrapper.classList.contains("ql-document")) return "document";
    }
  }

  const slice = quill.getContents(index, 1);
  const insert = slice.ops?.[0]?.insert;
  if (insert && typeof insert === "object") {
    if ("image" in insert) return "image";
    if ("video" in insert) return "video";
    if ("document" in insert) return "document";
  }

  return null;
}

function resolveImageEmbedIndex(
  quill: Quill,
  range: RangeStatic | null,
  lastImageEmbedIndex: number | null,
): number | null {
  if (range && range.length === 0) {
    const kind = getEmbedKindAtIndex(quill, range.index);
    if (kind === "image") {
      return range.index;
    }
  }
  return lastImageEmbedIndex;
}

function buildImageLinkRequest(
  quill: Quill,
  index: number,
): QuillLinkEditRequest {
  const [blot] = quill.getLeaf(index);
  const node = blot?.domNode;
  const wrapper =
    node instanceof HTMLElement
      ? node.closest(`.${MEDIA_EMBED_WRAPPER_CLASS}`)
      : null;
  const currentLink =
    wrapper instanceof HTMLElement ? (readImageLink(wrapper) ?? "") : "";
  return {
    index,
    length: 0,
    target: "image",
    currentUrl: currentLink,
  };
}

function applyImageEmbedLinkAtIndex(
  quill: Quill,
  index: number,
  href: string | null,
): void {
  const [blot] = quill.getLeaf(index);
  if (!blot || !("format" in blot)) {
    return;
  }
  (blot as { format: (name: string, value: unknown) => void }).format(
    "link",
    href ?? false,
  );
}

function getHyperlinkAnchorFromNode(
  node: EventTarget | null,
): HTMLAnchorElement | null {
  if (!(node instanceof HTMLElement)) {
    return null;
  }
  const anchor = node.closest("a.delta-editor-hyperlink");
  return anchor instanceof HTMLAnchorElement ? anchor : null;
}

function findLinkBlotRangeAtIndex(
  quill: Quill,
  index: number,
): RangeStatic | null {
  const [leaf] = quill.getLeaf(index);
  let blot: unknown = leaf;
  while (blot) {
    const linkBlot = blot as {
      statics?: { blotName?: string };
      length?: () => number;
      parent?: unknown;
    };
    if (
      linkBlot.statics?.blotName === "link" &&
      typeof linkBlot.length === "function"
    ) {
      const blotIndex = quill.getIndex(blot as never);
      return { index: blotIndex, length: linkBlot.length() };
    }
    blot = linkBlot.parent;
  }
  return null;
}

/** Extend remove range across newline gaps between adjacent same-href link runs. */
function expandSameHrefAcrossBlockGaps(
  quill: Quill,
  range: RangeStatic,
): RangeStatic {
  const href = quill.getFormat(range.index, 1).link;
  if (typeof href !== "string" || !href) {
    return range;
  }

  const text = quill.getText();
  const maxIndex = Math.max(0, text.length - 1);
  let start = range.index;
  let end = range.index + range.length;

  const hasHref = (charIndex: number): boolean => {
    if (charIndex < 0 || charIndex > maxIndex) {
      return false;
    }
    return quill.getFormat(charIndex, 1).link === href;
  };

  while (start > 0) {
    if (hasHref(start - 1)) {
      start -= 1;
      continue;
    }
    if (text[start - 1] === "\n" && hasHref(start - 2)) {
      start -= 1;
      continue;
    }
    break;
  }

  while (end <= maxIndex) {
    if (hasHref(end)) {
      end += 1;
      continue;
    }
    if (text[end] === "\n" && hasHref(end + 1)) {
      end += 1;
      continue;
    }
    break;
  }

  return { index: start, length: end - start };
}

type SnowTooltip = {
  linkRange?: RangeStatic;
  hide?: () => void;
};

function getSnowTooltip(quill: Quill): SnowTooltip | null {
  return (
    (quill as { theme?: { tooltip?: SnowTooltip } }).theme?.tooltip ?? null
  );
}

function getQuillTooltipElements(quill: Quill) {
  const container = quill.root.closest(".ql-container");
  const tooltipRoot = container?.querySelector(".ql-tooltip");
  return {
    container,
    tooltipRoot,
    removeButton: container?.querySelector("a.ql-remove"),
    actionButton: container?.querySelector("a.ql-action"),
    textbox: container?.querySelector('.ql-tooltip input[type="text"]'),
  };
}

function bindQuillLinkTooltipFix(quill: Quill): () => void {
  let pointerLinkRange: RangeStatic | null = null;
  let pointerExpandedLinkRange: RangeStatic | null = null;

  const resolveExpandedRange = (): RangeStatic | null => {
    if (pointerExpandedLinkRange) {
      return pointerExpandedLinkRange;
    }
    const tooltip = getSnowTooltip(quill);
    const baseRange = pointerLinkRange ?? tooltip?.linkRange ?? null;
    if (!baseRange) {
      return null;
    }
    return expandSameHrefAcrossBlockGaps(quill, baseRange);
  };

  const rememberExpandedRange = (baseRange: RangeStatic | null) => {
    if (!baseRange) {
      pointerExpandedLinkRange = null;
      return;
    }
    const expanded = expandSameHrefAcrossBlockGaps(quill, baseRange);
    pointerExpandedLinkRange = expanded;
    const tooltip = getSnowTooltip(quill);
    if (tooltip) {
      tooltip.linkRange = expanded;
    }
  };

  const clearTooltipLinkState = () => {
    pointerLinkRange = null;
    pointerExpandedLinkRange = null;
    const tooltip = getSnowTooltip(quill);
    if (tooltip?.linkRange) {
      delete tooltip.linkRange;
    }
    tooltip?.hide?.();
  };

  const onEditorPointerDown = (event: MouseEvent) => {
    const anchor = getHyperlinkAnchorFromNode(event.target);
    if (!anchor) {
      pointerLinkRange = null;
      pointerExpandedLinkRange = null;
      return;
    }

    requestAnimationFrame(() => {
      const selection = quill.getSelection(true);
      if (!selection) {
        return;
      }
      const linkRange = findLinkBlotRangeAtIndex(quill, selection.index);
      pointerLinkRange = linkRange;
      rememberExpandedRange(linkRange);
    });
  };

  const onSelectionChange = (range: RangeStatic | null) => {
    if (range == null || range.length !== 0) {
      return;
    }
    requestAnimationFrame(() => {
      const { tooltipRoot } = getQuillTooltipElements(quill);
      if (!(tooltipRoot instanceof HTMLElement)) {
        return;
      }
      if (tooltipRoot.classList.contains("ql-hidden")) {
        return;
      }
      if (tooltipRoot.classList.contains("ql-editing")) {
        return;
      }
      const tooltip = getSnowTooltip(quill);
      if (!tooltip?.linkRange) {
        return;
      }
      rememberExpandedRange(tooltip.linkRange);
    });
  };

  const applyExpandedLinkSave = (rawValue: string): boolean => {
    const expanded = resolveExpandedRange();
    if (!expanded) {
      return false;
    }

    const trimmed = rawValue.trim();
    if (!trimmed) {
      quill.formatText(
        expanded.index,
        expanded.length,
        CLEAR_LINK_FORMATS,
        "api",
      );
      syncEditorLinkAttributes(quill);
      clearTooltipLinkState();
      return true;
    }

    const href = normalizeEmbedLink(trimmed);
    if (!href) {
      return false;
    }

    quill.formatText(expanded.index, expanded.length, { link: href }, "api");
    syncEditorLinkAttributes(quill);
    clearTooltipLinkState();
    return true;
  };

  const onRemoveClick = (event: Event) => {
    const expanded = resolveExpandedRange();
    if (!expanded) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    quill.formatText(
      expanded.index,
      expanded.length,
      CLEAR_LINK_FORMATS,
      "api",
    );
    syncEditorLinkAttributes(quill);
    clearTooltipLinkState();
  };

  const onActionClick = (event: Event) => {
    const { tooltipRoot } = getQuillTooltipElements(quill);
    if (!(tooltipRoot instanceof HTMLElement)) {
      return;
    }

    if (tooltipRoot.classList.contains("ql-editing")) {
      const expanded = resolveExpandedRange();
      if (!expanded) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      const { textbox } = getQuillTooltipElements(quill);
      const value = textbox instanceof HTMLInputElement ? textbox.value : "";
      applyExpandedLinkSave(value);
      return;
    }

    requestAnimationFrame(() => {
      rememberExpandedRange(
        pointerLinkRange ?? getSnowTooltip(quill)?.linkRange ?? null,
      );
    });
  };

  const onTextboxKeydown = (event: Event) => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }
    const { tooltipRoot, textbox } = getQuillTooltipElements(quill);
    if (!(tooltipRoot instanceof HTMLElement)) {
      return;
    }
    if (!tooltipRoot.classList.contains("ql-editing")) {
      return;
    }
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    const value = textbox instanceof HTMLInputElement ? textbox.value : "";
    applyExpandedLinkSave(value);
  };

  quill.root.addEventListener("mousedown", onEditorPointerDown, true);
  quill.on("selection-change", onSelectionChange);
  const { removeButton, actionButton, textbox } =
    getQuillTooltipElements(quill);
  removeButton?.addEventListener("click", onRemoveClick, true);
  actionButton?.addEventListener("click", onActionClick, true);
  textbox?.addEventListener("keydown", onTextboxKeydown, true);

  return () => {
    quill.off("selection-change", onSelectionChange);
    quill.root.removeEventListener("mousedown", onEditorPointerDown, true);
    removeButton?.removeEventListener("click", onRemoveClick, true);
    actionButton?.removeEventListener("click", onActionClick, true);
    textbox?.removeEventListener("keydown", onTextboxKeydown, true);
  };
}

export function applyQuillLinkEdit(
  quill: Quill,
  request: QuillLinkEditRequest,
  rawUrl: string,
): boolean {
  const trimmed = rawUrl.trim();
  const embedLength = request.target === "text" ? request.length : 1;

  if (!trimmed) {
    if (request.target === "image") {
      applyImageEmbedLinkAtIndex(quill, request.index, null);
    } else {
      quill.formatText(request.index, embedLength, CLEAR_LINK_FORMATS, "api");
    }
    syncEditorLinkAttributes(quill);
    return true;
  }

  const href = normalizeEmbedLink(trimmed);
  if (!href) {
    return false;
  }

  if (request.target === "image") {
    applyImageEmbedLinkAtIndex(quill, request.index, href);
  } else {
    quill.formatText(request.index, embedLength, { link: href }, "api");
  }
  syncEditorLinkAttributes(quill);
  return true;
}

export function syncEditorLinkAttributes(quill: Quill): void {
  for (const anchor of quill.root.querySelectorAll("a[href]")) {
    if (!(anchor instanceof HTMLAnchorElement)) {
      continue;
    }
    if (anchor.closest(".ql-document")) {
      continue;
    }
    const href = anchor.getAttribute("href") ?? "";
    if (href) {
      anchor.setAttribute("title", href);
    }
    anchor.classList.add("delta-editor-hyperlink");
  }
}

export function bindQuillLinkHandler(
  quill: Quill,
  handlers: LinkHandlerCallbacks,
): () => void {
  let lastTextSelection: RangeStatic | null = null;
  let lastImageEmbedIndex: number | null = null;

  const rememberImageEmbedFromPointer = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const wrapper = target.closest(`.${MEDIA_EMBED_WRAPPER_CLASS}.ql-image`);
    if (!(wrapper instanceof HTMLElement)) {
      return;
    }
    const index = resolveImageEmbedIndexFromNode(quill, wrapper);
    if (index != null) {
      lastImageEmbedIndex = index;
    }
  };

  const onSelectionChange = (range: RangeStatic | null) => {
    if (range && range.length > 0) {
      lastTextSelection = cloneRange(range);
      lastImageEmbedIndex = null;
      return;
    }
    if (range && range.length === 0) {
      const imageIndex = resolveImageEmbedIndex(quill, range, null);
      if (imageIndex != null) {
        lastImageEmbedIndex = imageIndex;
      }
    }
  };
  quill.on("selection-change", onSelectionChange);
  quill.root.addEventListener("mousedown", rememberImageEmbedFromPointer, true);

  const toolbar = quill.getModule("toolbar") as
    | {
        addHandler: (name: string, handler: () => void) => void;
        container: HTMLElement;
      }
    | undefined;

  const captureLinkSelection = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest("button.ql-link")) {
      return;
    }
    if (event.type === "mousedown") {
      event.preventDefault();
    }
    const range = quill.getSelection(true);
    if (range && range.length > 0) {
      lastTextSelection = cloneRange(range);
      lastImageEmbedIndex = null;
      return;
    }
    if (range && range.length === 0) {
      const imageIndex = resolveImageEmbedIndex(quill, range, null);
      if (imageIndex != null) {
        lastImageEmbedIndex = imageIndex;
      }
    }
  };

  toolbar?.container.addEventListener("mousedown", captureLinkSelection, true);
  toolbar?.container.addEventListener("click", captureLinkSelection, true);

  const openLinkEditor = () => {
    const current = quill.getSelection(true);
    const imageIndex = resolveImageEmbedIndex(
      quill,
      current,
      lastImageEmbedIndex,
    );

    if (imageIndex != null) {
      handlers.onRequestLinkEdit(buildImageLinkRequest(quill, imageIndex));
      return;
    }

    const textRange =
      lastTextSelection ??
      (current && current.length > 0 ? cloneRange(current) : null);

    if (!textRange || textRange.length === 0) {
      if (current && current.length === 0) {
        const embedKind = getEmbedKindAtIndex(quill, current.index);
        if (embedKind === "document" || embedKind === "video") {
          handlers.onLinkNotOnFile();
          return;
        }
      }
      handlers.onLinkNoSelection();
      return;
    }

    const currentFormats = quill.getFormat(textRange.index, textRange.length);
    const currentLink =
      typeof currentFormats.link === "string" ? currentFormats.link : "";
    handlers.onRequestLinkEdit({
      index: textRange.index,
      length: textRange.length,
      target: "text",
      currentUrl: currentLink,
    });
  };

  toolbar?.addHandler("link", openLinkEditor);

  const unbindTooltipFix = bindQuillLinkTooltipFix(quill);

  const onTextChange = () => syncEditorLinkAttributes(quill);
  quill.on("text-change", onTextChange);
  syncEditorLinkAttributes(quill);

  return () => {
    quill.off("selection-change", onSelectionChange);
    quill.root.removeEventListener(
      "mousedown",
      rememberImageEmbedFromPointer,
      true,
    );
    quill.off("text-change", onTextChange);
    unbindTooltipFix();
    toolbar?.container.removeEventListener(
      "mousedown",
      captureLinkSelection,
      true,
    );
    toolbar?.container.removeEventListener("click", captureLinkSelection, true);
  };
}

export function bindQuillImageLinkEdit(
  quill: Quill,
  onRequestLinkEdit: (request: QuillLinkEditRequest) => void,
): () => void {
  const onClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const button = target.closest(`.${IMAGE_LINK_EDIT_CLASS}`);
    if (!button) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const wrapper = button.closest(`.${MEDIA_EMBED_WRAPPER_CLASS}.ql-image`);
    if (!(wrapper instanceof HTMLElement)) {
      return;
    }

    const index = resolveImageEmbedIndexFromNode(quill, wrapper);
    if (index == null) {
      return;
    }

    onRequestLinkEdit(buildImageLinkRequest(quill, index));
  };

  quill.root.addEventListener("click", onClick);
  return () => quill.root.removeEventListener("click", onClick);
}
