import type Quill from "quill";
import type { DeltaStatic } from "quill";
import type { DeltaMediaEmbed, DeltaShape } from "@/lib/utils/course-delta";
import {
  coerceToDelta,
  filterDeltaMediaEmbeds,
  stripDeltaFormatAttributes,
  stripMediaEmbedsFromDelta,
  TEXT_DELTA_LOCKED_FORMAT_ATTRIBUTES,
} from "@/lib/utils/course-delta";
import {
  DEFAULT_MEDIA_EMBED_KINDS,
  type DeltaMediaEmbedRef,
  getMediaEmbedFilesFromDataTransfer,
  hasMediaEmbedFilesInDataTransfer,
  type MediaEmbedKind,
} from "@/lib/utils/media";
import type { MediaFile } from "@/types/media";
import { appendImageResizeHandles } from "./delta-editor-image-resize";
import {
  LINK_COLOR_FORMAT,
  LINK_COLOR_PALETTE,
  registerLinkColorFormat,
} from "./delta-editor-link-color";
import {
  applyQuillLinkEdit,
  bindQuillLinkHandler,
  type QuillLinkEditRequest,
} from "./delta-editor-link-quill";

export type DeltaEditorMediaPickerMode = MediaEmbedKind;

export type DeltaEditorQuillConfig = {
  allowMediaEmbed: boolean;
  mediaEmbedKinds: readonly MediaEmbedKind[];
  allowLink: boolean;
  /**
   * When true: omit font + heading pickers / `font`+`header` formats; strip
   * `TEXT_DELTA_LOCKED_FORMAT_ATTRIBUTES` (`font`/`size`/`header`) on normalize.
   */
  lockSystemFont: boolean;
};

/** Read-only viewer renders every embed kind plus hyperlinks. */
export const DELTA_VIEWER_QUILL_CONFIG: DeltaEditorQuillConfig = {
  allowMediaEmbed: true,
  mediaEmbedKinds: ["image", "video", "document"],
  allowLink: true,
  lockSystemFont: false,
};

export function resolveDeltaEditorQuillConfig(options: {
  allowMediaEmbed?: boolean;
  mediaEmbedKinds?: readonly MediaEmbedKind[];
  allowLink?: boolean;
  lockSystemFont?: boolean;
}): DeltaEditorQuillConfig {
  const allowMediaEmbed = options.allowMediaEmbed ?? true;
  return {
    allowMediaEmbed,
    mediaEmbedKinds: allowMediaEmbed
      ? (options.mediaEmbedKinds ?? DEFAULT_MEDIA_EMBED_KINDS)
      : [],
    allowLink: options.allowLink ?? false,
    lockSystemFont: options.lockSystemFont ?? false,
  };
}

/** Whitelist passed to Quill `formats/font` and the toolbar font picker. */
export const QUILL_FONT_WHITELIST = [
  "roboto",
  "gilroy",
  "geist-mono",
  "serif",
  "monospace",
] as const;

const TEXT_EDITOR_FORMATS = [
  "header",
  "font",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
] as const;

// No `header`: headings change font size, which locked-font surfaces forbid.
const TEXT_EDITOR_FORMATS_LOCKED_FONT = [
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
] as const;

const LINK_FORMAT = "link" as const;

const TEXT_TOOLBAR_HEADER = [{ header: [1, 2, 3, false] }] as const;
const TEXT_TOOLBAR_FONT = [{ font: [...QUILL_FONT_WHITELIST] }] as const;
const TEXT_TOOLBAR_INLINE = ["bold", "italic", "underline", "strike"] as const;
const TEXT_TOOLBAR_LISTS = [{ list: "ordered" }, { list: "bullet" }] as const;
const TEXT_TOOLBAR_CLEAN = ["clean"] as const;

const MEDIA_EMBED_WRAPPER_CLASS = "ql-media-embed";
const MEDIA_EMBED_REMOVE_CLASS = "ql-media-embed-remove";
const IMAGE_LINK_CLASS = "ql-image-link";
const IMAGE_LINK_EDIT_CLASS = "ql-image-link-edit";
const IMAGE_WIDTH_FORMAT = "width" as const;
const IMAGE_HEIGHT_FORMAT = "height" as const;

let quillFormatsRegistered = false;
let quillMediaEmbedsDeletable = false;
let quillImageLinkEditable = false;
let quillMediaEmbedRemoveLabel = "Remove media";
let quillImageLinkEditLabel = "Edit link";
let quillLoadPromise: Promise<typeof Quill> | null = null;
let QuillRuntime: typeof Quill | null = null;

/** Client-only: loads Quill + styles once before editor init (avoids SSR `document` errors). */
export async function ensureQuillLoaded(): Promise<typeof Quill> {
  if (typeof window === "undefined") {
    throw new Error("Quill can only be loaded in the browser");
  }

  if (QuillRuntime) {
    return QuillRuntime;
  }

  if (!quillLoadPromise) {
    quillLoadPromise = (async () => {
      await import("quill/dist/quill.snow.css");
      await import("./delta-editor.css");
      const mod = await import("quill");
      QuillRuntime = mod.default;
      return QuillRuntime;
    })();
  }

  return quillLoadPromise;
}

function getQuill(): typeof Quill {
  if (!QuillRuntime) {
    throw new Error("Call ensureQuillLoaded() before using Quill helpers");
  }

  return QuillRuntime;
}

type BlockEmbedClass = {
  new (): HTMLElement;
  blotName: string;
  tagName: string;
  create(value: string): HTMLElement;
  value(node: HTMLElement): string;
};

export function setQuillMediaEmbedsDeletable(deletable: boolean): void {
  quillMediaEmbedsDeletable = deletable;
}

export function setQuillMediaEmbedRemoveLabel(label: string): void {
  quillMediaEmbedRemoveLabel = label;
}

export function setQuillImageLinkEditable(editable: boolean): void {
  quillImageLinkEditable = editable;
}

export function setQuillImageLinkEditLabel(label: string): void {
  quillImageLinkEditLabel = label;
}

function annotateMediaEmbedNode(
  node: HTMLElement,
  kind: MediaEmbedKind,
  media: Pick<MediaFile, "id" | "object_key" | "url">,
): void {
  node.dataset.mediaKind = kind;
  node.dataset.mediaUrl = media.url;
  if (media.id) {
    node.dataset.mediaId = media.id;
  }
  if (media.object_key) {
    node.dataset.mediaObjectKey = media.object_key;
  }
}

function createImageLinkEditButton(): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = IMAGE_LINK_EDIT_CLASS;
  button.setAttribute("aria-label", quillImageLinkEditLabel);
  button.title = quillImageLinkEditLabel;
  button.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
  return button;
}

function appendImageEmbedControls(node: HTMLElement): void {
  if (quillImageLinkEditable) {
    node.appendChild(createImageLinkEditButton());
  }
  node.appendChild(createMediaEmbedRemoveButton());
  appendImageResizeHandles(node);
}

function readImageLinkFromWrapper(node: HTMLElement): string | undefined {
  const anchor = node.querySelector(`a.${IMAGE_LINK_CLASS}`);
  if (anchor instanceof HTMLAnchorElement && anchor.href) {
    return anchor.href;
  }
  return node.dataset.mediaLink || undefined;
}

function createMediaEmbedRemoveButton(): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = MEDIA_EMBED_REMOVE_CLASS;
  button.setAttribute("aria-label", quillMediaEmbedRemoveLabel);
  button.textContent = "×";
  return button;
}

function fileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const segment = pathname.split("/").filter(Boolean).pop();
    return segment ? decodeURIComponent(segment) : "Document";
  } catch {
    return "Document";
  }
}

function buildMediaEmbedWrapper(
  kind: MediaEmbedKind,
  url: string,
): HTMLElement {
  const node = document.createElement("div");
  node.classList.add(
    MEDIA_EMBED_WRAPPER_CLASS,
    kind === "image"
      ? "ql-image"
      : kind === "video"
        ? "ql-video"
        : "ql-document",
    "relative",
    "inline-block",
    "max-w-full",
    "rounded-md",
    "my-2",
  );
  node.contentEditable = "false";

  if (kind === "image") {
    const img = document.createElement("img");
    img.setAttribute("src", url);
    img.setAttribute("alt", "");
    img.classList.add("max-w-full", "rounded-md");
    node.appendChild(img);
  } else if (kind === "video") {
    const video = document.createElement("video");
    video.setAttribute("src", url);
    video.setAttribute("controls", "true");
    video.setAttribute("playsinline", "true");
    video.classList.add("max-w-full", "rounded-md", "block");
    node.appendChild(video);
  } else {
    const link = document.createElement("a");
    link.classList.add(
      "ql-document-link",
      "inline-flex",
      "items-center",
      "gap-2",
      "rounded-md",
      "border",
      "px-3",
      "py-2",
      "text-sm",
    );
    link.setAttribute("href", url);
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
    link.textContent = fileNameFromUrl(url);
    node.appendChild(link);
  }

  if (quillMediaEmbedsDeletable) {
    if (kind === "image") {
      appendImageEmbedControls(node);
    } else {
      node.appendChild(createMediaEmbedRemoveButton());
    }
  }

  return node;
}

export function registerMediaEmbed(
  registry: Map<string, DeltaMediaEmbedRef>,
  kind: MediaEmbedKind,
  media: MediaFile,
): DeltaMediaEmbedRef {
  const ref: DeltaMediaEmbedRef = {
    kind,
    url: media.url,
    id: media.id,
    object_key: media.object_key,
  };
  registry.set(media.url, ref);
  return ref;
}

export function resolveMediaEmbedRef(
  embed: DeltaMediaEmbed,
  registry: Map<string, DeltaMediaEmbedRef>,
): DeltaMediaEmbedRef {
  const cached = registry.get(embed.url);
  if (cached) {
    return cached;
  }

  return {
    kind: embed.kind,
    url: embed.url,
    object_key: "",
    id: undefined,
  };
}

export function annotateEmbedAtIndex(
  quill: Quill,
  index: number,
  kind: MediaEmbedKind,
  media: Pick<MediaFile, "id" | "object_key" | "url">,
): void {
  const [blot] = quill.getLeaf(index);
  const node = blot?.domNode;
  if (node instanceof HTMLElement) {
    annotateMediaEmbedNode(node, kind, media);
  }
}

export function buildEditorFormats(config: DeltaEditorQuillConfig): string[] {
  const formats: string[] = [
    ...(config.lockSystemFont
      ? TEXT_EDITOR_FORMATS_LOCKED_FONT
      : TEXT_EDITOR_FORMATS),
  ];
  if (config.allowLink) {
    formats.push(LINK_FORMAT, LINK_COLOR_FORMAT);
  }
  if (config.allowMediaEmbed) {
    for (const kind of config.mediaEmbedKinds) {
      formats.push(kind);
    }
    if (config.mediaEmbedKinds.includes("image")) {
      formats.push(IMAGE_WIDTH_FORMAT, IMAGE_HEIGHT_FORMAT);
    }
  }
  return formats;
}

function mediaToolbarItems(kinds: readonly MediaEmbedKind[]): MediaEmbedKind[] {
  const items: MediaEmbedKind[] = [];
  if (kinds.includes("image")) items.push("image");
  if (kinds.includes("video")) items.push("video");
  if (kinds.includes("document")) items.push("document");
  return items;
}

export function buildToolbarContainer(config: DeltaEditorQuillConfig) {
  const rows: unknown[] = [];
  if (!config.lockSystemFont) {
    rows.push(TEXT_TOOLBAR_HEADER, TEXT_TOOLBAR_FONT);
  }
  rows.push(TEXT_TOOLBAR_INLINE, TEXT_TOOLBAR_LISTS);

  if (config.allowLink) {
    rows.push(["link", { linkColor: [...LINK_COLOR_PALETTE] }]);
  }

  if (config.allowMediaEmbed) {
    const mediaItems = mediaToolbarItems(config.mediaEmbedKinds);
    if (mediaItems.length > 0) {
      rows.push([...mediaItems]);
    }
  }

  rows.push(TEXT_TOOLBAR_CLEAN);
  return rows;
}

/** Shared Quill embed formats (HTML5 video + styled inline images/documents). */
export function registerQuillFormats(): void {
  if (
    quillFormatsRegistered ||
    typeof window === "undefined" ||
    !QuillRuntime
  ) {
    return;
  }

  quillFormatsRegistered = true;

  const Quill = getQuill();
  const Font = Quill.import("formats/font") as { whitelist: string[] };
  Font.whitelist = [...QUILL_FONT_WHITELIST];
  Quill.register(Font, true);

  const Link = Quill.import("formats/link") as {
    new (...args: unknown[]): unknown;
    blotName: string;
    tagName: string;
  };
  Quill.register(Link, true);
  registerLinkColorFormat(Quill);

  const BlockEmbed = Quill.import("blots/block/embed") as BlockEmbedClass;

  class StyledImageBlot extends BlockEmbed {
    static blotName = "image";
    static tagName = "div";
    static className = "ql-image";

    static create(url: string) {
      return buildMediaEmbedWrapper("image", url);
    }

    static value(node: HTMLElement) {
      const img = node.querySelector("img");
      return img?.getAttribute("src") ?? node.dataset.mediaUrl ?? "";
    }

    static formats(node: HTMLElement) {
      const formats: Record<string, string> = {};
      const link = readImageLinkFromWrapper(node);
      if (link) {
        formats.link = link;
      }
      const img = node.querySelector("img");
      if (img instanceof HTMLImageElement) {
        if (img.style.width) {
          formats.width = img.style.width;
        }
        if (img.style.height) {
          formats.height = img.style.height;
        }
      }
      return formats;
    }

    format(name: string, value: unknown) {
      const node = (this as unknown as { domNode: HTMLElement }).domNode;

      if (name === IMAGE_WIDTH_FORMAT || name === IMAGE_HEIGHT_FORMAT) {
        const img = node.querySelector("img");
        if (!(img instanceof HTMLImageElement)) {
          return;
        }
        const prop = name === IMAGE_WIDTH_FORMAT ? "width" : "height";
        if (value === false || value == null || value === "") {
          img.style.removeProperty(prop);
          return;
        }
        img.style[prop] = String(value);
        img.style.maxWidth = "100%";
        return;
      }

      if (name !== "link") {
        return;
      }

      const existing = node.querySelector(`a.${IMAGE_LINK_CLASS}`);
      if (existing) {
        const linkedImg = existing.querySelector("img");
        if (linkedImg) {
          existing.replaceWith(linkedImg);
        } else {
          existing.remove();
        }
      }
      delete node.dataset.mediaLink;

      if (value === false || value == null || value === "") {
        return;
      }

      const href = String(value);
      node.dataset.mediaLink = href;

      const anchor = document.createElement("a");
      anchor.classList.add(IMAGE_LINK_CLASS, "delta-editor-hyperlink");
      anchor.setAttribute("href", href);
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
      anchor.setAttribute("title", href);

      const img = node.querySelector("img");
      if (img) {
        img.replaceWith(anchor);
        anchor.appendChild(img);
      }
    }
  }

  class Html5VideoBlot extends BlockEmbed {
    static blotName = "video";
    static tagName = "div";
    static className = "ql-video";

    static create(url: string) {
      return buildMediaEmbedWrapper("video", url);
    }

    static value(node: HTMLElement) {
      const video = node.querySelector("video");
      return video?.getAttribute("src") ?? node.dataset.mediaUrl ?? "";
    }
  }

  class DocumentBlot extends BlockEmbed {
    static blotName = "document";
    static tagName = "div";
    static className = "ql-document";

    static create(url: string) {
      return buildMediaEmbedWrapper("document", url);
    }

    static value(node: HTMLElement) {
      const link = node.querySelector("a.ql-document-link");
      return link?.getAttribute("href") ?? node.dataset.mediaUrl ?? "";
    }
  }

  Quill.register(StyledImageBlot, true);
  Quill.register(Html5VideoBlot, true);
  Quill.register(DocumentBlot, true);
}

export function toQuillContents(delta: DeltaShape): DeltaStatic {
  return delta as unknown as DeltaStatic;
}

export function normalizeDeltaForEditor(
  raw: string,
  config: DeltaEditorQuillConfig,
): ReturnType<typeof coerceToDelta> {
  let parsed = coerceToDelta(raw);
  if (!config.allowMediaEmbed) {
    parsed = stripMediaEmbedsFromDelta(parsed);
  } else {
    parsed = filterDeltaMediaEmbeds(parsed, config.mediaEmbedKinds);
  }
  if (config.lockSystemFont) {
    parsed = stripDeltaFormatAttributes(
      parsed,
      TEXT_DELTA_LOCKED_FORMAT_ATTRIBUTES,
    );
  }
  return parsed;
}

export function bindQuillMediaHandlers(
  quill: Quill,
  onPickMedia: (mode: DeltaEditorMediaPickerMode) => void,
  allowedKinds: readonly MediaEmbedKind[],
): void {
  const toolbar = quill.getModule("toolbar") as
    | { addHandler: (name: string, handler: () => void) => void }
    | undefined;

  if (allowedKinds.includes("image")) {
    toolbar?.addHandler("image", () => onPickMedia("image"));
  }
  if (allowedKinds.includes("video")) {
    toolbar?.addHandler("video", () => onPickMedia("video"));
  }
  if (allowedKinds.includes("document")) {
    toolbar?.addHandler("document", () => onPickMedia("document"));
  }
}

/** Block Quill from embedding pasted HTML images/videos (base64 or external URLs). */
export function blockQuillClipboardMediaEmbed(quill: Quill): void {
  const Delta = getQuill().import("delta") as typeof import("quill").Delta;

  quill.clipboard.addMatcher("IMG", () => new Delta());
  quill.clipboard.addMatcher("VIDEO", () => new Delta());
}

type MediaPasteDropHandlers = {
  onMediaFiles: (files: File[], insertIndex: number) => void;
  onDragStateChange: (dragging: boolean) => void;
  isEnabled: () => boolean;
  allowedKinds: readonly MediaEmbedKind[];
};

export function bindQuillMediaPasteAndDrop(
  quill: Quill,
  handlers: MediaPasteDropHandlers,
): () => void {
  blockQuillClipboardMediaEmbed(quill);

  const editor = quill.root;

  const resolveInsertIndex = () =>
    quill.getSelection(true)?.index ?? quill.getLength();

  const onPaste = (event: ClipboardEvent) => {
    if (!handlers.isEnabled() || !event.clipboardData) {
      return;
    }

    const files = getMediaEmbedFilesFromDataTransfer(
      event.clipboardData,
      handlers.allowedKinds,
    );
    if (!files.length) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    handlers.onMediaFiles(files, resolveInsertIndex());
  };

  const onDragOver = (event: DragEvent) => {
    if (!handlers.isEnabled() || !event.dataTransfer) {
      return;
    }
    if (
      !hasMediaEmbedFilesInDataTransfer(
        event.dataTransfer,
        handlers.allowedKinds,
      )
    ) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    handlers.onDragStateChange(true);
  };

  const onDragLeave = (event: DragEvent) => {
    if (!handlers.isEnabled()) {
      return;
    }

    const related = event.relatedTarget as Node | null;
    if (related && editor.contains(related)) {
      return;
    }
    handlers.onDragStateChange(false);
  };

  const onDrop = (event: DragEvent) => {
    handlers.onDragStateChange(false);
    if (!handlers.isEnabled() || !event.dataTransfer) {
      return;
    }

    const files = getMediaEmbedFilesFromDataTransfer(
      event.dataTransfer,
      handlers.allowedKinds,
    );
    if (!files.length) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    handlers.onMediaFiles(files, resolveInsertIndex());
  };

  editor.addEventListener("paste", onPaste, true);
  editor.addEventListener("dragover", onDragOver);
  editor.addEventListener("dragleave", onDragLeave);
  editor.addEventListener("drop", onDrop);

  return () => {
    editor.removeEventListener("paste", onPaste, true);
    editor.removeEventListener("dragover", onDragOver);
    editor.removeEventListener("dragleave", onDragLeave);
    editor.removeEventListener("drop", onDrop);
  };
}

export function bindQuillMediaEmbedRemove(quill: Quill): () => void {
  const onClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const button = target.closest(`.${MEDIA_EMBED_REMOVE_CLASS}`);
    if (!button) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const embed = button.closest(`.${MEDIA_EMBED_WRAPPER_CLASS}`);
    if (!embed) {
      return;
    }

    const blot = getQuill().find(embed);
    if (!blot) {
      return;
    }

    const index = quill.getIndex(blot);
    quill.deleteText(index, 1, "user");
  };

  quill.root.addEventListener("click", onClick);
  return () => quill.root.removeEventListener("click", onClick);
}

export {
  bindQuillLinkColorHandler,
  LINK_COLOR_FORMAT,
  LINK_COLOR_PALETTE,
  registerLinkColorFormat,
} from "./delta-editor-link-color";
export { applyQuillLinkEdit, bindQuillLinkHandler, type QuillLinkEditRequest };
