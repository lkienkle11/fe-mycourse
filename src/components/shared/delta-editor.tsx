"use client";

import { useTranslations } from "next-intl";
import type { DeltaStatic } from "quill";
import Quill from "quill";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { uploadMediaFiles } from "@/api/callers/media";
import { MediaCollectionDialog } from "@/components/features/media";
import { RequiredLabel } from "@/components/shared/required-label";
import { Label } from "@/components/ui/label";
import { PERMISSIONS } from "@/constants/permissions";
import { useSatisfiesPermissions } from "@/hooks/auth";
import { cn } from "@/lib/utils";
import { toastApiError } from "@/lib/utils/api-error";
import {
  parseDelta,
  stringifyDelta,
  stripMediaEmbedsFromDelta,
} from "@/lib/utils/course-delta";
import {
  classifyMediaEmbedFile,
  getMediaEmbedFilesFromDataTransfer,
  hasMediaEmbedFilesInDataTransfer,
  validateMediaUploadBatch,
} from "@/lib/utils/media";
import type { MediaFile, MediaTab } from "@/types/media";
import "quill/dist/quill.snow.css";
import "./delta-editor.css";

export type DeltaEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** When false, toolbar hides image/video and embed ops are stripped from output. Default true. */
  allowMediaEmbed?: boolean;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
};

export type DeltaViewerProps = {
  value: string;
  className?: string;
};

type MediaPickerMode = "image" | "video";

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

let quillFormatsRegistered = false;

type BlockEmbedClass = {
  new (): HTMLElement;
  blotName: string;
  tagName: string;
  create(value: string): HTMLElement;
  value(node: HTMLElement): string;
};

function buildEditorFormats(allowMediaEmbed: boolean): string[] {
  return allowMediaEmbed
    ? [...TEXT_EDITOR_FORMATS, ...MEDIA_EDITOR_FORMATS]
    : [...TEXT_EDITOR_FORMATS];
}

function buildToolbarContainer(allowMediaEmbed: boolean) {
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
    static tagName = "img";

    static create(url: string) {
      const node = document.createElement("img");
      node.setAttribute("src", url);
      node.setAttribute("alt", "");
      node.classList.add("ql-image", "max-w-full", "rounded-md");
      return node;
    }

    static value(node: HTMLImageElement) {
      return node.getAttribute("src") ?? "";
    }
  }

  class Html5VideoBlot extends BlockEmbed {
    static blotName = "video";
    static tagName = "video";

    static create(url: string) {
      const node = document.createElement("video");
      node.setAttribute("src", url);
      node.setAttribute("controls", "true");
      node.setAttribute("playsinline", "true");
      node.classList.add("ql-video", "max-w-full", "rounded-md");
      return node;
    }

    static value(node: HTMLVideoElement) {
      return node.getAttribute("src") ?? "";
    }
  }

  Quill.register(StyledImageBlot, true);
  Quill.register(Html5VideoBlot, true);
}

function toQuillContents(delta: ReturnType<typeof parseDelta>): DeltaStatic {
  return delta as unknown as DeltaStatic;
}

function normalizeDeltaForEditor(
  raw: string,
  allowMediaEmbed: boolean,
): ReturnType<typeof parseDelta> {
  const parsed = parseDelta(raw);
  return allowMediaEmbed ? parsed : stripMediaEmbedsFromDelta(parsed);
}

function bindQuillMediaHandlers(
  quill: Quill,
  onPickMedia: (mode: MediaPickerMode) => void,
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

function bindQuillMediaPasteAndDrop(
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

const quillSurfaceClassName = cn(
  "[&_.ql-toolbar]:border-input [&_.ql-toolbar]:bg-muted/40",
  "[&_.ql-container]:border-0",
  "[&_.ql-editor]:min-h-56 [&_.ql-editor]:px-4 [&_.ql-editor]:py-3",
  "[&_.ql-editor]:text-sm [&_.ql-editor]:leading-relaxed",
  "[&_.ql-editor_img]:my-2 [&_.ql-editor_video]:my-2",
  "[&_.ql-editor_.ql-video]:block",
);

export function DeltaEditor({
  value,
  onChange,
  disabled = false,
  allowMediaEmbed = true,
  label,
  required = false,
  placeholder,
  className,
}: DeltaEditorProps) {
  const t = useTranslations("course.editor.deltaEditor");
  const tValidation = useTranslations("media.validation");
  const tErrors = useTranslations("errors.codes");
  const canUploadMedia = useSatisfiesPermissions({
    permissions: [PERMISSIONS.MediaFileCreate],
  });
  const editorHostRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);
  const allowMediaEmbedRef = useRef(allowMediaEmbed);
  const disabledRef = useRef(disabled);
  const canUploadMediaRef = useRef(canUploadMedia);
  const skipExternalSyncRef = useRef(false);
  const insertIndexRef = useRef<number | null>(null);
  const initialValueRef = useRef(value);
  const initialDisabledRef = useRef(disabled);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [mediaPickerMode, setMediaPickerMode] =
    useState<MediaPickerMode>("image");
  const [isDraggingMedia, setIsDraggingMedia] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const isUploadingMediaRef = useRef(false);

  const editorFormats = useMemo(
    () => buildEditorFormats(allowMediaEmbed),
    [allowMediaEmbed],
  );
  const toolbarContainer = useMemo(
    () => buildToolbarContainer(allowMediaEmbed),
    [allowMediaEmbed],
  );

  const textLabel = label ?? t("lessonTextLabel");
  const editorPlaceholder = placeholder ?? t("placeholder");
  const editorPlaceholderRef = useRef(editorPlaceholder);

  useEffect(() => {
    editorPlaceholderRef.current = editorPlaceholder;
  }, [editorPlaceholder]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    allowMediaEmbedRef.current = allowMediaEmbed;
  }, [allowMediaEmbed]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    canUploadMediaRef.current = canUploadMedia;
  }, [canUploadMedia]);

  useEffect(() => {
    isUploadingMediaRef.current = isUploadingMedia;
  }, [isUploadingMedia]);

  const openMediaPicker = useCallback((mode: MediaPickerMode) => {
    if (!allowMediaEmbedRef.current) {
      return;
    }

    const quill = quillRef.current;
    if (quill) {
      const range = quill.getSelection(true);
      insertIndexRef.current = range?.index ?? quill.getLength();
    }

    setMediaPickerMode(mode);
    setMediaDialogOpen(true);
  }, []);
  const openMediaPickerRef = useRef(openMediaPicker);

  useEffect(() => {
    openMediaPickerRef.current = openMediaPicker;
  }, [openMediaPicker]);

  const uploadMediaFilesAt = useCallback(
    async (rawFiles: File[], insertIndex: number) => {
      if (
        !allowMediaEmbedRef.current ||
        disabledRef.current ||
        isUploadingMediaRef.current
      ) {
        return;
      }

      if (!canUploadMediaRef.current) {
        toast.error(t("uploadNoPermission"));
        return;
      }

      const quill = quillRef.current;
      if (!quill) {
        return;
      }

      const entries = rawFiles.flatMap((file) => {
        const mode = classifyMediaEmbedFile(file);
        return mode ? [{ file, mode }] : [];
      });

      if (!entries.length) {
        if (rawFiles.length > 0) {
          toast.error(t("unsupportedFile"));
        }
        return;
      }

      setIsUploadingMedia(true);
      let cursor = insertIndex;

      try {
        for (const { file, mode } of entries) {
          const issue = validateMediaUploadBatch([file], mode);
          if (issue) {
            toast.error(tValidation(issue.messageKey));
            continue;
          }

          const uploaded = await uploadMediaFiles([file]);
          const media = uploaded[0];
          if (!media?.url) {
            continue;
          }

          quill.insertEmbed(cursor, mode, media.url, "user");
          quill.insertText(cursor + 1, "\n", "user");
          cursor += 2;
        }

        quill.setSelection(cursor, 0, "user");
      } catch (error) {
        toastApiError(tErrors, error);
      } finally {
        setIsUploadingMedia(false);
      }
    },
    [t, tErrors, tValidation],
  );
  const uploadMediaFilesAtRef = useRef(uploadMediaFilesAt);

  useEffect(() => {
    uploadMediaFilesAtRef.current = uploadMediaFilesAt;
  }, [uploadMediaFilesAt]);

  useEffect(() => {
    registerQuillFormats();

    const host = editorHostRef.current;
    if (!host || quillRef.current) {
      return;
    }

    const container = document.createElement("div");
    host.appendChild(container);

    const quill = new Quill(container, {
      theme: "snow",
      formats: editorFormats,
      placeholder: editorPlaceholderRef.current,
      modules: {
        toolbar: toolbarContainer,
      },
    });

    if (allowMediaEmbedRef.current) {
      bindQuillMediaHandlers(quill, (mode) => openMediaPickerRef.current(mode));
    }

    let unbindPasteDrop: (() => void) | undefined;
    if (allowMediaEmbedRef.current) {
      unbindPasteDrop = bindQuillMediaPasteAndDrop(quill, {
        isEnabled: () =>
          allowMediaEmbedRef.current &&
          !disabledRef.current &&
          !isUploadingMediaRef.current,
        onDragStateChange: setIsDraggingMedia,
        onMediaFiles: (files, insertIndex) => {
          void uploadMediaFilesAtRef.current(files, insertIndex);
        },
      });
    }

    quill.setContents(
      toQuillContents(
        normalizeDeltaForEditor(
          initialValueRef.current,
          allowMediaEmbedRef.current,
        ),
      ),
    );
    quill.enable(!initialDisabledRef.current);

    quill.on("text-change", () => {
      skipExternalSyncRef.current = true;
      const nextDelta = { ops: quill.getContents().ops as never[] };
      const normalized = allowMediaEmbedRef.current
        ? nextDelta
        : stripMediaEmbedsFromDelta(nextDelta);
      onChangeRef.current(stringifyDelta(normalized));
    });

    quillRef.current = quill;

    return () => {
      unbindPasteDrop?.();
      quillRef.current = null;
      host.innerHTML = "";
    };
  }, [editorFormats, toolbarContainer]);

  useEffect(() => {
    if (skipExternalSyncRef.current) {
      skipExternalSyncRef.current = false;
      return;
    }

    const quill = quillRef.current;
    if (!quill) {
      return;
    }

    const parsed = normalizeDeltaForEditor(value, allowMediaEmbed);
    const current = quill.getContents();
    if (JSON.stringify(current.ops) !== JSON.stringify(parsed.ops)) {
      quill.setContents(toQuillContents(parsed), "silent");
    }
  }, [allowMediaEmbed, value]);

  useEffect(() => {
    quillRef.current?.enable(!disabled);
  }, [disabled]);

  const insertMediaEmbed = useCallback(
    (file: MediaFile, mode: MediaPickerMode) => {
      if (!allowMediaEmbedRef.current) {
        return;
      }

      const quill = quillRef.current;
      if (!quill) {
        return;
      }

      const index = insertIndexRef.current ?? quill.getLength();
      quill.insertEmbed(index, mode, file.url, "user");
      quill.insertText(index + 1, "\n", "user");
      quill.setSelection(index + 2, 0, "user");
      insertIndexRef.current = null;
    },
    [],
  );

  const handleMediaSelect = useCallback(
    (file: MediaFile, type: MediaTab) => {
      if (!allowMediaEmbed || type !== mediaPickerMode) {
        return;
      }

      insertMediaEmbed(file, mediaPickerMode);
      setMediaDialogOpen(false);
    },
    [allowMediaEmbed, insertMediaEmbed, mediaPickerMode],
  );

  return (
    <div className={cn("space-y-2", className)}>
      {required ? (
        <RequiredLabel htmlFor="delta-editor">{textLabel}</RequiredLabel>
      ) : (
        <Label htmlFor="delta-editor">{textLabel}</Label>
      )}

      <div
        id="delta-editor"
        className={cn(
          "relative overflow-hidden rounded-md border border-input bg-background",
          quillSurfaceClassName,
          (disabled || isUploadingMedia) && "pointer-events-none opacity-60",
        )}
      >
        <div ref={editorHostRef} />
        {isDraggingMedia ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-md border-2 border-dashed border-primary bg-muted/60">
            <p className="text-sm font-medium text-foreground">
              {t("dropHint")}
            </p>
          </div>
        ) : null}
        {isUploadingMedia ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-muted/80 px-3 py-1 text-center text-xs text-muted-foreground">
            {t("uploading")}
          </div>
        ) : null}
      </div>

      {allowMediaEmbed ? (
        <MediaCollectionDialog
          open={mediaDialogOpen}
          onOpenChange={setMediaDialogOpen}
          defaultTab={mediaPickerMode}
          visibleTabs={[mediaPickerMode]}
          selectionMode="single"
          onSelect={handleMediaSelect}
        />
      ) : null}
    </div>
  );
}

/** Read-only WYSIWYG renderer for stored Quill Delta JSON (same embed rendering as editor). */
export function DeltaViewer({ value, className }: DeltaViewerProps) {
  const editorHostRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const initialValueRef = useRef(value);
  const viewerFormats = useMemo(() => buildEditorFormats(true), []);

  useEffect(() => {
    registerQuillFormats();

    const host = editorHostRef.current;
    if (!host || quillRef.current) {
      return;
    }

    const container = document.createElement("div");
    host.appendChild(container);

    const quill = new Quill(container, {
      theme: "snow",
      formats: viewerFormats,
      readOnly: true,
      modules: {
        toolbar: false,
      },
    });

    quill.setContents(toQuillContents(parseDelta(initialValueRef.current)));
    quill.enable(false);
    quillRef.current = quill;

    return () => {
      quillRef.current = null;
      host.innerHTML = "";
    };
  }, [viewerFormats]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) {
      return;
    }

    const parsed = parseDelta(value);
    const current = quill.getContents();
    if (JSON.stringify(current.ops) !== JSON.stringify(parsed.ops)) {
      quill.setContents(toQuillContents(parsed), "silent");
    }
  }, [value]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-input bg-background",
        quillSurfaceClassName,
        "[&_.ql-toolbar]:hidden",
        className,
      )}
    >
      <div ref={editorHostRef} />
    </div>
  );
}
