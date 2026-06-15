import {
  MEDIA_COLLECTION_ALL_TABS,
  MEDIA_DOCUMENT_EXTENSIONS,
  MEDIA_EXECUTABLE_EXTENSIONS,
  MEDIA_IMAGE_EXTENSIONS,
  MEDIA_MAX_BYTES_PER_FILE,
  MEDIA_MAX_BYTES_PER_REQUEST,
  MEDIA_MAX_FILES_PER_REQUEST,
  MEDIA_VIDEO_EXTENSIONS,
} from "@/constants/media/file-rules";
import type {
  MediaCategory,
  MediaFile,
  MediaListFilters,
  MediaSortOption,
  MediaTab,
} from "@/types/media";
import { formatUnixDateTime } from "./date";

export function isImageFilename(filename: string): boolean {
  const lower = filename.toLowerCase();
  return MEDIA_IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function getMediaTabExtensions(tab: MediaTab): readonly string[] {
  switch (tab) {
    case "image":
      return MEDIA_IMAGE_EXTENSIONS;
    case "video":
      return MEDIA_VIDEO_EXTENSIONS;
    case "document":
      return MEDIA_DOCUMENT_EXTENSIONS;
  }
}

export function isExecutableExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return MEDIA_EXECUTABLE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function mediaTabToCategory(tab: MediaTab): MediaCategory {
  return tab;
}

/** Keeps canonical tab order; ignores unknown entries. Default = all tabs. */
export function resolveVisibleMediaTabs(
  visibleTabs?: readonly MediaTab[],
): readonly MediaTab[] {
  if (!visibleTabs?.length) return MEDIA_COLLECTION_ALL_TABS;
  const allowed = new Set(visibleTabs);
  return MEDIA_COLLECTION_ALL_TABS.filter((tab) => allowed.has(tab));
}

export function resolveMediaCollectionDefaultTab(
  defaultTab: MediaTab,
  visibleTabs: readonly MediaTab[],
): MediaTab {
  if (visibleTabs.includes(defaultTab)) return defaultTab;
  return visibleTabs[0] ?? "image";
}

export function classifyMediaTab(file: MediaFile): MediaTab {
  if (file.kind === "VIDEO") return "video";
  if (isImageMedia(file)) return "image";
  return "document";
}

/** Aligns with BE `IsImageMIMEOrExt`. */
export function isImageMedia(
  file: Pick<MediaFile, "mime_type" | "filename">,
): boolean {
  const mime = (file.mime_type ?? "").toLowerCase();
  if (mime.startsWith("image/")) return true;
  return isImageFilename(file.filename ?? "");
}

/** DELETE path uses object_key, not row id. */
export function getMediaDeleteKey(file: MediaFile): string {
  return file.object_key;
}

export function formatMediaDate(unixSeconds: number | undefined): string {
  return formatUnixDateTime(unixSeconds);
}

export function parseMediaSortOption(
  option: MediaSortOption,
): Pick<MediaListFilters, "sort_by" | "sort_order"> {
  switch (option) {
    case "filename_asc":
      return { sort_by: "filename", sort_order: "asc" };
    default:
      return { sort_by: "created_at", sort_order: "desc" };
  }
}

export type MediaUploadValidationIssue = {
  code: "too_many" | "file_too_large" | "total_too_large" | "executable";
  /** i18n key under `media.validation` namespace. */
  messageKey:
    | "tooMany"
    | "fileTooLarge"
    | "totalTooLarge"
    | "executableRejected";
};

export function validateMediaUploadBatch(
  files: File[],
  tab: MediaTab,
): MediaUploadValidationIssue | null {
  if (files.length > MEDIA_MAX_FILES_PER_REQUEST) {
    return { code: "too_many", messageKey: "tooMany" };
  }
  let total = 0;
  for (const file of files) {
    if (file.size > MEDIA_MAX_BYTES_PER_FILE) {
      return { code: "file_too_large", messageKey: "fileTooLarge" };
    }
    total += file.size;
    if (tab === "document" && isExecutableExtension(file.name)) {
      return { code: "executable", messageKey: "executableRejected" };
    }
  }
  if (total > MEDIA_MAX_BYTES_PER_REQUEST) {
    return { code: "total_too_large", messageKey: "totalTooLarge" };
  }
  return null;
}

export type MediaEmbedKind = "image" | "video" | "document";

/** Default embed kinds for TEXT sub-lessons (image + video). */
export const DEFAULT_MEDIA_EMBED_KINDS: readonly MediaEmbedKind[] = [
  "image",
  "video",
];

/** Media embed removed from DeltaEditor — enough to call `deleteMediaFile(object_key)`. */
export type DeltaMediaEmbedRef = Pick<
  MediaFile,
  "id" | "object_key" | "url"
> & {
  kind: MediaEmbedKind;
};

export function isDocumentFilename(filename: string): boolean {
  const lower = filename.toLowerCase();
  return MEDIA_DOCUMENT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/** Maps a local file to an editor embed kind (image/video/document), or null if unsupported. */
export function classifyMediaEmbedFile(file: File): MediaEmbedKind | null {
  const mime = file.type.toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";

  const lower = file.name.toLowerCase();
  if (MEDIA_IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    return "image";
  }
  if (MEDIA_VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    return "video";
  }
  if (MEDIA_DOCUMENT_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    return "document";
  }
  if (
    mime.startsWith("application/") ||
    mime.startsWith("text/") ||
    mime === "application/pdf"
  ) {
    return "document";
  }
  return null;
}

function mediaEmbedFileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

/** Collects unique embeddable files from a paste or drop DataTransfer. */
export function getMediaEmbedFilesFromDataTransfer(
  dataTransfer: DataTransfer,
  allowedKinds?: readonly MediaEmbedKind[],
): File[] {
  const seen = new Set<string>();
  const files: File[] = [];

  const push = (file: File | null) => {
    const kind = file ? classifyMediaEmbedFile(file) : null;
    if (!file || !kind) return;
    if (allowedKinds && !allowedKinds.includes(kind)) return;
    const key = mediaEmbedFileKey(file);
    if (seen.has(key)) return;
    seen.add(key);
    files.push(file);
  };

  for (const file of dataTransfer.files) {
    push(file);
  }
  for (const item of dataTransfer.items) {
    if (item.kind === "file") {
      push(item.getAsFile());
    }
  }

  return files;
}

export function hasMediaEmbedFilesInDataTransfer(
  dataTransfer: DataTransfer,
  allowedKinds?: readonly MediaEmbedKind[],
): boolean {
  return (
    getMediaEmbedFilesFromDataTransfer(dataTransfer, allowedKinds).length > 0
  );
}
