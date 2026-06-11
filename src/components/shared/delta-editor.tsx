"use client";

import { useTranslations } from "next-intl";
import Quill from "quill";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MediaCollectionDialog } from "@/components/features/media";
import { RequiredLabel } from "@/components/shared/required-label";
import { Label } from "@/components/ui/label";
import {
  annotateEmbedAtIndex,
  bindQuillMediaEmbedRemove,
  bindQuillMediaHandlers,
  bindQuillMediaPasteAndDrop,
  buildEditorFormats,
  buildToolbarContainer,
  type DeltaEditorMediaPickerMode,
  normalizeDeltaForEditor,
  registerMediaEmbed,
  registerQuillFormats,
  resolveMediaEmbedRef,
  setQuillMediaEmbedRemoveLabel,
  setQuillMediaEmbedsDeletable,
  toQuillContents,
} from "@/lib/quill";
import { cn } from "@/lib/utils";
import { toastApiError } from "@/lib/utils/api-error";
import {
  type DeltaMediaEmbed,
  diffRemovedMediaEmbeds,
  extractMediaEmbedsFromDelta,
  parseDelta,
  stringifyDelta,
  stripMediaEmbedsFromDelta,
} from "@/lib/utils/course-delta";
import type { DeltaMediaEmbedRef, MediaEmbedKind } from "@/lib/utils/media";
import { classifyMediaEmbedFile } from "@/lib/utils/media";
import type { MediaFile, MediaTab } from "@/types/media";

export type DeltaEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** When false, toolbar hides image/video and embed ops are stripped from output. Default true. */
  allowMediaEmbed?: boolean;
  label?: string;
  required?: boolean;
  placeholder?: string;
  /** Wrapper around label + editor surface. */
  className?: string;
  /** Bordered Quill surface (default `max-h-[500px]`; override e.g. `max-h-[600px]`). */
  surfaceClassName?: string;
  /** Paste/drop upload — parent calls media API and returns the uploaded file. */
  onObjectEmbedded?: (
    file: File,
    kind: MediaEmbedKind,
  ) => Promise<MediaFile | null | undefined>;
  /** Image/video removed from the editor (X button or Backspace/Delete). */
  onDelete?: (embed: DeltaMediaEmbedRef) => void | Promise<void>;
};

export type DeltaViewerProps = {
  value: string;
  className?: string;
};

export { QUILL_FONT_WHITELIST, registerQuillFormats } from "@/lib/quill";

/** Default scroll cap; override via `surfaceClassName` / `className` on DeltaViewer. */
export const DELTA_EDITOR_DEFAULT_MAX_HEIGHT_CLASS = "max-h-[500px]";

const quillSurfaceClassName = cn(
  "delta-editor-surface",
  "[&_.ql-container]:scrollbar-app",
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
  surfaceClassName,
  onObjectEmbedded,
  onDelete,
}: DeltaEditorProps) {
  const t = useTranslations("course.editor.deltaEditor");
  const tErrors = useTranslations("errors.codes");
  const editorHostRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);
  const onObjectEmbeddedRef = useRef(onObjectEmbedded);
  const onDeleteRef = useRef(onDelete);
  const allowMediaEmbedRef = useRef(allowMediaEmbed);
  const disabledRef = useRef(disabled);
  const skipExternalSyncRef = useRef(false);
  const insertIndexRef = useRef<number | null>(null);
  const initialValueRef = useRef(value);
  const initialDisabledRef = useRef(disabled);
  const mediaRegistryRef = useRef(new Map<string, DeltaMediaEmbedRef>());
  const previousEmbedsRef = useRef<DeltaMediaEmbed[]>([]);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [mediaPickerMode, setMediaPickerMode] =
    useState<DeltaEditorMediaPickerMode>("image");
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
  const editorPlaceholder =
    placeholder ??
    (allowMediaEmbed ? t("placeholder") : t("placeholderTextOnly"));
  const editorPlaceholderRef = useRef(editorPlaceholder);
  const removeEmbedLabel = t("removeEmbed");

  useEffect(() => {
    editorPlaceholderRef.current = editorPlaceholder;
    quillRef.current?.root.setAttribute("data-placeholder", editorPlaceholder);
  }, [editorPlaceholder]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onObjectEmbeddedRef.current = onObjectEmbedded;
  }, [onObjectEmbedded]);

  useEffect(() => {
    onDeleteRef.current = onDelete;
  }, [onDelete]);

  useEffect(() => {
    allowMediaEmbedRef.current = allowMediaEmbed;
  }, [allowMediaEmbed]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    isUploadingMediaRef.current = isUploadingMedia;
  }, [isUploadingMedia]);

  const openMediaPicker = useCallback((mode: DeltaEditorMediaPickerMode) => {
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

  const embedMediaFilesAt = useCallback(
    async (rawFiles: File[], insertIndex: number) => {
      if (
        !allowMediaEmbedRef.current ||
        disabledRef.current ||
        isUploadingMediaRef.current
      ) {
        return;
      }

      const onEmbedded = onObjectEmbeddedRef.current;
      if (!onEmbedded) {
        toast.error(t("embedHandlerMissing"));
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
          const media = await onEmbedded(file, mode);
          if (!media?.url) {
            continue;
          }

          registerMediaEmbed(mediaRegistryRef.current, mode, media);
          quill.insertEmbed(cursor, mode, media.url, "user");
          annotateEmbedAtIndex(quill, cursor, mode, media);
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
    [t, tErrors],
  );
  const embedMediaFilesAtRef = useRef(embedMediaFilesAt);

  useEffect(() => {
    embedMediaFilesAtRef.current = embedMediaFilesAt;
  }, [embedMediaFilesAt]);

  useEffect(() => {
    setQuillMediaEmbedsDeletable(true);
    setQuillMediaEmbedRemoveLabel(removeEmbedLabel);
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
    let unbindEmbedRemove: (() => void) | undefined;
    if (allowMediaEmbedRef.current) {
      unbindPasteDrop = bindQuillMediaPasteAndDrop(quill, {
        isEnabled: () =>
          allowMediaEmbedRef.current &&
          !disabledRef.current &&
          !isUploadingMediaRef.current,
        onDragStateChange: setIsDraggingMedia,
        onMediaFiles: (files, insertIndex) => {
          void embedMediaFilesAtRef.current(files, insertIndex);
        },
      });
      unbindEmbedRemove = bindQuillMediaEmbedRemove(quill);
    }

    const initialDelta = normalizeDeltaForEditor(
      initialValueRef.current,
      allowMediaEmbedRef.current,
    );
    quill.setContents(toQuillContents(initialDelta));
    previousEmbedsRef.current = extractMediaEmbedsFromDelta(initialDelta);
    quill.enable(!initialDisabledRef.current);

    quill.on("text-change", () => {
      const nextDelta = { ops: quill.getContents().ops as never[] };
      const nextEmbeds = extractMediaEmbedsFromDelta(nextDelta);
      const removedEmbeds = diffRemovedMediaEmbeds(
        previousEmbedsRef.current,
        nextEmbeds,
      );
      previousEmbedsRef.current = nextEmbeds;

      for (const embed of removedEmbeds) {
        const ref = resolveMediaEmbedRef(embed, mediaRegistryRef.current);
        mediaRegistryRef.current.delete(embed.url);
        void onDeleteRef.current?.(ref);
      }

      skipExternalSyncRef.current = true;
      const normalized = allowMediaEmbedRef.current
        ? nextDelta
        : stripMediaEmbedsFromDelta(nextDelta);
      onChangeRef.current(stringifyDelta(normalized));
    });

    quillRef.current = quill;

    return () => {
      unbindPasteDrop?.();
      unbindEmbedRemove?.();
      setQuillMediaEmbedsDeletable(false);
      quillRef.current = null;
      host.innerHTML = "";
    };
  }, [editorFormats, removeEmbedLabel, toolbarContainer]);

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
      previousEmbedsRef.current = extractMediaEmbedsFromDelta(parsed);
    }
  }, [allowMediaEmbed, value]);

  useEffect(() => {
    quillRef.current?.enable(!disabled);
  }, [disabled]);

  const insertMediaEmbed = useCallback(
    (file: MediaFile, mode: DeltaEditorMediaPickerMode) => {
      if (!allowMediaEmbedRef.current) {
        return;
      }

      const quill = quillRef.current;
      if (!quill) {
        return;
      }

      const index = insertIndexRef.current ?? quill.getLength();
      registerMediaEmbed(mediaRegistryRef.current, mode, file);
      quill.insertEmbed(index, mode, file.url, "user");
      annotateEmbedAtIndex(quill, index, mode, file);
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
          "relative min-h-0 flex flex-col overflow-hidden rounded-md border border-input bg-background",
          DELTA_EDITOR_DEFAULT_MAX_HEIGHT_CLASS,
          quillSurfaceClassName,
          surfaceClassName,
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
    setQuillMediaEmbedsDeletable(false);
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
        "min-h-0 flex flex-col overflow-hidden rounded-md border border-input bg-background",
        DELTA_EDITOR_DEFAULT_MAX_HEIGHT_CLASS,
        quillSurfaceClassName,
        "[&_.ql-toolbar]:hidden",
        className,
      )}
    >
      <div ref={editorHostRef} />
    </div>
  );
}
