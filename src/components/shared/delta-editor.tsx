"use client";

import { useTranslations } from "next-intl";
import type Quill from "quill";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MediaCollectionDialog } from "@/components/features/media";
import {
  DeltaEditorLinkDialog,
  type DeltaEditorLinkDialogLabels,
} from "@/components/shared/delta-editor-link-dialog";
import { RequiredLabel } from "@/components/shared/required-label";
import { Label } from "@/components/ui/label";
import {
  annotateEmbedAtIndex,
  applyQuillLinkEdit,
  bindQuillImageLinkEdit,
  bindQuillImageResize,
  bindQuillLinkColorHandler,
  bindQuillLinkHandler,
  bindQuillMediaEmbedRemove,
  bindQuillMediaHandlers,
  bindQuillMediaPasteAndDrop,
  blockQuillClipboardMediaEmbed,
  buildEditorFormats,
  buildToolbarContainer,
  DELTA_VIEWER_QUILL_CONFIG,
  type DeltaEditorMediaPickerMode,
  ensureQuillLoaded,
  normalizeDeltaForEditor,
  type QuillLinkEditRequest,
  registerMediaEmbed,
  registerQuillFormats,
  resolveDeltaEditorQuillConfig,
  resolveMediaEmbedRef,
  setQuillImageLinkEditable,
  setQuillImageLinkEditLabel,
  setQuillMediaEmbedRemoveLabel,
  setQuillMediaEmbedsDeletable,
  toQuillContents,
} from "@/lib/quill";
import { cn } from "@/lib/utils";
import { toastApiError } from "@/lib/utils/api-error";
import {
  coerceToDelta,
  type DeltaMediaEmbed,
  type DeltaShape,
  diffRemovedMediaEmbeds,
  extractMediaEmbedsFromDelta,
  filterDeltaMediaEmbeds,
  stringifyDelta,
  stripDeltaFormatAttributes,
  stripMediaEmbedsFromDelta,
  TEXT_DELTA_LOCKED_FORMAT_ATTRIBUTES,
} from "@/lib/utils/course-delta";
import {
  classifyMediaEmbedFile,
  DEFAULT_MEDIA_EMBED_KINDS,
  type DeltaMediaEmbedRef,
  type MediaEmbedKind,
} from "@/lib/utils/media";
import type { MediaFile, MediaTab } from "@/types/media";

export type DeltaEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** When false, toolbar hides media actions and embed ops are stripped from output. Default true. */
  allowMediaEmbed?: boolean;
  /** Subset of embed kinds in toolbar / paste-drop. Default image + video. */
  mediaEmbedKinds?: readonly MediaEmbedKind[];
  /** Link toolbar for selected text and image embeds. Default false. */
  allowLink?: boolean;
  /**
   * Omit font + heading pickers / `font`+`header` formats; strip
   * `TEXT_DELTA_LOCKED_FORMAT_ATTRIBUTES`; inherit system font.
   * Default false. Pass `label=""` when an outer Field already renders the label.
   */
  lockSystemFont?: boolean;
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
  /** Image/video/document removed from the editor (X button or Backspace/Delete). */
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

type MediaHintKeys = {
  dropHint: "dropHint" | "dropHintImageDocument";
  unsupportedFile: "unsupportedFile" | "unsupportedFileImageDocument";
};

function resolveMediaHintKeys(kinds: readonly MediaEmbedKind[]): MediaHintKeys {
  const hasVideo = kinds.includes("video");
  const hasDocument = kinds.includes("document");
  if (hasDocument && !hasVideo) {
    return {
      dropHint: "dropHintImageDocument",
      unsupportedFile: "unsupportedFileImageDocument",
    };
  }
  return { dropHint: "dropHint", unsupportedFile: "unsupportedFile" };
}

export function DeltaEditor({
  value,
  onChange,
  disabled = false,
  allowMediaEmbed = true,
  mediaEmbedKinds = DEFAULT_MEDIA_EMBED_KINDS,
  allowLink = false,
  lockSystemFont = false,
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
  const quillConfigRef = useRef(
    resolveDeltaEditorQuillConfig({
      allowMediaEmbed,
      mediaEmbedKinds,
      allowLink,
      lockSystemFont,
    }),
  );
  const disabledRef = useRef(disabled);
  const skipExternalSyncRef = useRef(false);
  const insertIndexRef = useRef<number | null>(null);
  const valueRef = useRef(value);
  const initialDisabledRef = useRef(disabled);
  const mediaRegistryRef = useRef(new Map<string, DeltaMediaEmbedRef>());
  const previousEmbedsRef = useRef<DeltaMediaEmbed[]>([]);
  const pendingLinkEditRef = useRef<QuillLinkEditRequest | null>(null);
  const tRef = useRef(t);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [mediaPickerMode, setMediaPickerMode] =
    useState<DeltaEditorMediaPickerMode>("image");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkInitialUrl, setLinkInitialUrl] = useState("");
  const [isDraggingMedia, setIsDraggingMedia] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const isUploadingMediaRef = useRef(false);

  const quillConfig = useMemo(
    () =>
      resolveDeltaEditorQuillConfig({
        allowMediaEmbed,
        mediaEmbedKinds,
        allowLink,
        lockSystemFont,
      }),
    [allowMediaEmbed, mediaEmbedKinds, allowLink, lockSystemFont],
  );

  const editorFormats = useMemo(
    () => buildEditorFormats(quillConfig),
    [quillConfig],
  );
  const toolbarContainer = useMemo(
    () => buildToolbarContainer(quillConfig),
    [quillConfig],
  );
  const mediaHintKeys = useMemo(
    () => resolveMediaHintKeys(mediaEmbedKinds),
    [mediaEmbedKinds],
  );

  const hideLabel = label === "";
  const textLabel = hideLabel ? "" : (label ?? t("lessonTextLabel"));
  const editorPlaceholder =
    placeholder ??
    (allowMediaEmbed ? t("placeholder") : t("placeholderTextOnly"));
  const editorPlaceholderRef = useRef(editorPlaceholder);
  const removeEmbedLabel = t("removeEmbed");
  const editImageLinkLabel = t("editImageLink");

  const linkDialogLabels = useMemo<DeltaEditorLinkDialogLabels>(
    () => ({
      title: t("linkDialog.title"),
      urlLabel: t("linkDialog.urlLabel"),
      urlPlaceholder: t("linkDialog.urlPlaceholder"),
      apply: t("linkDialog.apply"),
      remove: t("linkDialog.remove"),
      cancel: t("linkDialog.cancel"),
    }),
    [t],
  );

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    quillConfigRef.current = quillConfig;
  }, [quillConfig]);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

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
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    isUploadingMediaRef.current = isUploadingMedia;
  }, [isUploadingMedia]);

  const openMediaPicker = useCallback((mode: DeltaEditorMediaPickerMode) => {
    const config = quillConfigRef.current;
    if (!config.allowMediaEmbed || !config.mediaEmbedKinds.includes(mode)) {
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
      const config = quillConfigRef.current;
      if (
        !config.allowMediaEmbed ||
        disabledRef.current ||
        isUploadingMediaRef.current
      ) {
        return;
      }

      const onEmbedded = onObjectEmbeddedRef.current;
      if (!onEmbedded) {
        toast.error(tRef.current("embedHandlerMissing"));
        return;
      }

      const quill = quillRef.current;
      if (!quill) {
        return;
      }

      const hintKeys = resolveMediaHintKeys(config.mediaEmbedKinds);
      const entries = rawFiles.flatMap((file) => {
        const mode = classifyMediaEmbedFile(file);
        if (!mode || !config.mediaEmbedKinds.includes(mode)) {
          return [];
        }
        return [{ file, mode }];
      });

      if (!entries.length) {
        if (rawFiles.length > 0) {
          toast.error(tRef.current(hintKeys.unsupportedFile));
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
    [tErrors],
  );
  const embedMediaFilesAtRef = useRef(embedMediaFilesAt);

  useEffect(() => {
    embedMediaFilesAtRef.current = embedMediaFilesAt;
  }, [embedMediaFilesAt]);

  useEffect(() => {
    setQuillMediaEmbedRemoveLabel(removeEmbedLabel);
  }, [removeEmbedLabel]);

  useEffect(() => {
    setQuillImageLinkEditLabel(editImageLinkLabel);
  }, [editImageLinkLabel]);

  const applyPendingLink = useCallback((rawUrl: string) => {
    const quill = quillRef.current;
    const request = pendingLinkEditRef.current;
    if (!quill || !request) {
      return;
    }

    const ok = applyQuillLinkEdit(quill, request, rawUrl);
    if (!ok) {
      toast.error(tRef.current("linkDialog.invalidUrl"));
      return;
    }

    pendingLinkEditRef.current = null;
    setLinkDialogOpen(false);
  }, []);

  const removePendingLink = useCallback(() => {
    applyPendingLink("");
  }, [applyPendingLink]);

  useEffect(() => {
    const host = editorHostRef.current;
    let cancelled = false;
    let unbindPasteDrop: (() => void) | undefined;
    let unbindEmbedRemove: (() => void) | undefined;
    let unbindImageResize: (() => void) | undefined;
    let unbindImageLinkEdit: (() => void) | undefined;
    let unbindLinkColor: (() => void) | undefined;
    let unbindLink: (() => void) | undefined;

    void (async () => {
      const Quill = await ensureQuillLoaded();
      if (cancelled || !host || quillRef.current) {
        return;
      }

      setQuillMediaEmbedsDeletable(true);
      registerQuillFormats();

      const container = document.createElement("div");
      host.appendChild(container);

      const initConfig = quillConfigRef.current;
      setQuillImageLinkEditable(initConfig.allowLink);

      const quill = new Quill(container, {
        theme: "snow",
        formats: editorFormats,
        placeholder: editorPlaceholderRef.current,
        modules: {
          toolbar: toolbarContainer,
        },
      });

      if (initConfig.allowMediaEmbed) {
        bindQuillMediaHandlers(
          quill,
          (mode) => openMediaPickerRef.current(mode),
          initConfig.mediaEmbedKinds,
        );
        unbindPasteDrop = bindQuillMediaPasteAndDrop(quill, {
          isEnabled: () =>
            quillConfigRef.current.allowMediaEmbed &&
            !disabledRef.current &&
            !isUploadingMediaRef.current,
          allowedKinds: initConfig.mediaEmbedKinds,
          onDragStateChange: setIsDraggingMedia,
          onMediaFiles: (files, insertIndex) => {
            void embedMediaFilesAtRef.current(files, insertIndex);
          },
        });
        unbindEmbedRemove = bindQuillMediaEmbedRemove(quill);
        if (initConfig.mediaEmbedKinds.includes("image")) {
          unbindImageResize = bindQuillImageResize(quill);
        }
      } else {
        // Text-only: still block IMG/VIDEO clipboard embeds (no media paste/drop handlers).
        blockQuillClipboardMediaEmbed(quill);
      }

      if (initConfig.allowLink) {
        unbindLink = bindQuillLinkHandler(quill, {
          onRequestLinkEdit: (request) => {
            pendingLinkEditRef.current = request;
            setLinkInitialUrl(request.currentUrl);
            setLinkDialogOpen(true);
          },
          onLinkNotOnFile: () => {
            toast.error(tRef.current("linkNotOnFile"));
          },
          onLinkNoSelection: () => {
            toast.error(tRef.current("linkNoSelection"));
          },
        });
        if (initConfig.mediaEmbedKinds.includes("image")) {
          unbindImageLinkEdit = bindQuillImageLinkEdit(quill, (request) => {
            pendingLinkEditRef.current = request;
            setLinkInitialUrl(request.currentUrl);
            setLinkDialogOpen(true);
          });
        }
        unbindLinkColor = bindQuillLinkColorHandler(
          quill,
          () => {
            toast.error(tRef.current("linkColorNoSelection"));
          },
          tRef.current("linkColorLabel"),
        );
      }

      const initialDelta = normalizeDeltaForEditor(
        valueRef.current,
        initConfig,
      );
      quill.setContents(toQuillContents(initialDelta));
      previousEmbedsRef.current = extractMediaEmbedsFromDelta(initialDelta);
      quill.enable(!initialDisabledRef.current);

      quill.on("text-change", () => {
        const nextDelta: DeltaShape = {
          ops: quill.getContents().ops as DeltaShape["ops"],
        };
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
        const config = quillConfigRef.current;
        let normalized = nextDelta;
        if (!config.allowMediaEmbed) {
          normalized = stripMediaEmbedsFromDelta(nextDelta);
        } else if (config.mediaEmbedKinds.length > 0) {
          normalized = filterDeltaMediaEmbeds(
            nextDelta,
            config.mediaEmbedKinds,
          );
        }
        if (config.lockSystemFont) {
          normalized = stripDeltaFormatAttributes(
            normalized,
            TEXT_DELTA_LOCKED_FORMAT_ATTRIBUTES,
          );
        }
        onChangeRef.current(stringifyDelta(normalized));
      });

      quillRef.current = quill;
    })();

    return () => {
      cancelled = true;
      unbindPasteDrop?.();
      unbindEmbedRemove?.();
      unbindImageResize?.();
      unbindImageLinkEdit?.();
      unbindLinkColor?.();
      unbindLink?.();
      setQuillMediaEmbedsDeletable(false);
      setQuillImageLinkEditable(false);
      quillRef.current = null;
      pendingLinkEditRef.current = null;
      if (host) {
        host.innerHTML = "";
      }
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

    const parsed = normalizeDeltaForEditor(value, quillConfig);
    const current = quill.getContents();
    if (JSON.stringify(current.ops) !== JSON.stringify(parsed.ops)) {
      quill.setContents(toQuillContents(parsed), "silent");
      previousEmbedsRef.current = extractMediaEmbedsFromDelta(parsed);
    }
  }, [quillConfig, value]);

  useEffect(() => {
    quillRef.current?.enable(!disabled);
  }, [disabled]);

  const insertMediaEmbed = useCallback(
    (file: MediaFile, mode: DeltaEditorMediaPickerMode) => {
      const config = quillConfigRef.current;
      if (!config.allowMediaEmbed || !config.mediaEmbedKinds.includes(mode)) {
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
      if (
        !quillConfig.allowMediaEmbed ||
        type !== mediaPickerMode ||
        !quillConfig.mediaEmbedKinds.includes(mediaPickerMode)
      ) {
        return;
      }

      insertMediaEmbed(file, mediaPickerMode);
      setMediaDialogOpen(false);
    },
    [insertMediaEmbed, mediaPickerMode, quillConfig],
  );

  return (
    <div className={cn("space-y-2", className)}>
      {hideLabel ? null : required ? (
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
          lockSystemFont && "delta-editor-lock-system-font",
          surfaceClassName,
          (disabled || isUploadingMedia) && "pointer-events-none opacity-60",
        )}
      >
        <div ref={editorHostRef} />
        {isDraggingMedia ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-md border-2 border-dashed border-primary bg-muted/60">
            <p className="text-sm font-medium text-foreground">
              {t(mediaHintKeys.dropHint)}
            </p>
          </div>
        ) : null}
        {isUploadingMedia ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-muted/80 px-3 py-1 text-center text-xs text-muted-foreground">
            {t("uploading")}
          </div>
        ) : null}
      </div>

      {allowMediaEmbed && quillConfig.mediaEmbedKinds.length > 0 ? (
        <MediaCollectionDialog
          open={mediaDialogOpen}
          onOpenChange={setMediaDialogOpen}
          defaultTab={mediaPickerMode}
          visibleTabs={[mediaPickerMode]}
          selectionMode="single"
          onSelect={handleMediaSelect}
        />
      ) : null}

      {allowLink ? (
        <DeltaEditorLinkDialog
          open={linkDialogOpen}
          onOpenChange={(open) => {
            setLinkDialogOpen(open);
            if (!open) {
              pendingLinkEditRef.current = null;
            }
          }}
          initialUrl={linkInitialUrl}
          labels={linkDialogLabels}
          onApply={applyPendingLink}
          onRemove={removePendingLink}
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
  const viewerFormats = useMemo(
    () => buildEditorFormats(DELTA_VIEWER_QUILL_CONFIG),
    [],
  );

  useEffect(() => {
    const host = editorHostRef.current;
    let cancelled = false;

    void (async () => {
      const Quill = await ensureQuillLoaded();
      if (cancelled || !host || quillRef.current) {
        return;
      }

      setQuillMediaEmbedsDeletable(false);
      registerQuillFormats();

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

      quill.setContents(
        toQuillContents(coerceToDelta(initialValueRef.current)),
      );
      quill.enable(false);
      quillRef.current = quill;
    })();

    return () => {
      cancelled = true;
      quillRef.current = null;
      if (host) {
        host.innerHTML = "";
      }
    };
  }, [viewerFormats]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) {
      return;
    }

    const parsed = coerceToDelta(value);
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
