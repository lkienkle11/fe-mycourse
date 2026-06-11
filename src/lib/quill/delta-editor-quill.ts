import "quill/dist/quill.snow.css";
import type { DeltaStatic } from "quill";
import Quill from "quill";
import "./delta-editor.css";
import type { DeltaMediaEmbed } from "@/lib/utils/course-delta";
import {
  parseDelta,
  stripMediaEmbedsFromDelta,
} from "@/lib/utils/course-delta";
import type { DeltaMediaEmbedRef, MediaEmbedKind } from "@/lib/utils/media";
import {
  getMediaEmbedFilesFromDataTransfer,
  hasMediaEmbedFilesInDataTransfer,
} from "@/lib/utils/media";
import type { MediaFile } from "@/types/media";

export type DeltaEditorMediaPickerMode = "image" | "video";

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

const MEDIA_EDITOR_FORMATS = ["image", "video"] as const;

const TEXT_TOOLBAR_HEADER = [{ header: [1, 2, 3, false] }] as const;
const TEXT_TOOLBAR_FONT = [{ font: [...QUILL_FONT_WHITELIST] }] as const;
const TEXT_TOOLBAR_INLINE = ["bold", "italic", "underline", "strike"] as const;
const TEXT_TOOLBAR_LISTS = [{ list: "ordered" }, { list: "bullet" }] as const;
const TEXT_TOOLBAR_CLEAN = ["clean"] as const;

const TEXT_TOOLBAR_CONTAINER = [
  TEXT_TOOLBAR_HEADER,
  TEXT_TOOLBAR_FONT,
  TEXT_TOOLBAR_INLINE,
  TEXT_TOOLBAR_LISTS,
  TEXT_TOOLBAR_CLEAN,
] as const;

const MEDIA_TOOLBAR_ITEMS = ["image", "video"] as const;

const MEDIA_EMBED_WRAPPER_CLASS = "ql-media-embed";
const MEDIA_EMBED_REMOVE_CLASS = "ql-media-embed-remove";

let quillFormatsRegistered = false;
let quillMediaEmbedsDeletable = false;
let quillMediaEmbedRemoveLabel = "Remove media";

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

function createMediaEmbedRemoveButton(): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = MEDIA_EMBED_REMOVE_CLASS;
  button.setAttribute("aria-label", quillMediaEmbedRemoveLabel);
  button.textContent = "×";
  return button;
}

function buildMediaEmbedWrapper(
  kind: MediaEmbedKind,
  url: string,
): HTMLElement {
  const node = document.createElement("div");
  node.classList.add(
    MEDIA_EMBED_WRAPPER_CLASS,
    kind === "image" ? "ql-image" : "ql-video",
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
  } else {
    const video = document.createElement("video");
    video.setAttribute("src", url);
    video.setAttribute("controls", "true");
    video.setAttribute("playsinline", "true");
    video.classList.add("max-w-full", "rounded-md", "block");
    node.appendChild(video);
  }

  if (quillMediaEmbedsDeletable) {
    node.appendChild(createMediaEmbedRemoveButton());
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

export function buildEditorFormats(allowMediaEmbed: boolean): string[] {
  return allowMediaEmbed
    ? [...TEXT_EDITOR_FORMATS, ...MEDIA_EDITOR_FORMATS]
    : [...TEXT_EDITOR_FORMATS];
}

export function buildToolbarContainer(allowMediaEmbed: boolean) {
  if (!allowMediaEmbed) {
    return TEXT_TOOLBAR_CONTAINER;
  }

  return [
    TEXT_TOOLBAR_HEADER,
    TEXT_TOOLBAR_FONT,
    TEXT_TOOLBAR_INLINE,
    TEXT_TOOLBAR_LISTS,
    [...MEDIA_TOOLBAR_ITEMS],
    TEXT_TOOLBAR_CLEAN,
  ];
}

/** Shared Quill embed formats (HTML5 video + styled inline images). */
export function registerQuillFormats(): void {
  if (quillFormatsRegistered || typeof window === "undefined") {
    return;
  }

  quillFormatsRegistered = true;

  const Font = Quill.import("formats/font") as { whitelist: string[] };
  Font.whitelist = [...QUILL_FONT_WHITELIST];
  Quill.register(Font, true);

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

  Quill.register(StyledImageBlot, true);
  Quill.register(Html5VideoBlot, true);
}

export function toQuillContents(
  delta: ReturnType<typeof parseDelta>,
): DeltaStatic {
  return delta as unknown as DeltaStatic;
}

export function normalizeDeltaForEditor(
  raw: string,
  allowMediaEmbed: boolean,
): ReturnType<typeof parseDelta> {
  const parsed = parseDelta(raw);
  return allowMediaEmbed ? parsed : stripMediaEmbedsFromDelta(parsed);
}

export function bindQuillMediaHandlers(
  quill: Quill,
  onPickMedia: (mode: DeltaEditorMediaPickerMode) => void,
): void {
  const toolbar = quill.getModule("toolbar") as
    | { addHandler: (name: string, handler: () => void) => void }
    | undefined;

  toolbar?.addHandler("image", () => onPickMedia("image"));
  toolbar?.addHandler("video", () => onPickMedia("video"));
}

/** Block Quill from embedding pasted HTML images/videos (base64 or external URLs). */
function blockQuillClipboardMediaEmbed(quill: Quill): void {
  const Delta = Quill.import("delta") as typeof import("quill").Delta;

  quill.clipboard.addMatcher("IMG", () => new Delta());
  quill.clipboard.addMatcher("VIDEO", () => new Delta());
}

type MediaPasteDropHandlers = {
  onMediaFiles: (files: File[], insertIndex: number) => void;
  onDragStateChange: (dragging: boolean) => void;
  isEnabled: () => boolean;
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

    const files = getMediaEmbedFilesFromDataTransfer(event.clipboardData);
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
    if (!hasMediaEmbedFilesInDataTransfer(event.dataTransfer)) {
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

    const files = getMediaEmbedFilesFromDataTransfer(event.dataTransfer);
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

    const blot = Quill.find(embed);
    if (!blot) {
      return;
    }

    const index = quill.getIndex(blot);
    quill.deleteText(index, 1, "user");
  };

  quill.root.addEventListener("click", onClick);
  return () => quill.root.removeEventListener("click", onClick);
}
