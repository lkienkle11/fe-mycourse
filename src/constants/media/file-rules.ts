import type { MediaTab } from "@/types/media";

/** Mirrors BE `MaxMediaFilesPerRequest`. */
export const MEDIA_MAX_FILES_PER_REQUEST = 5;

/** Mirrors BE `MaxMediaUploadFileBytes` / aggregate cap (2 GiB). */
export const MEDIA_MAX_BYTES_PER_FILE = 2 * 1024 * 1024 * 1024;
export const MEDIA_MAX_BYTES_PER_REQUEST = 2 * 1024 * 1024 * 1024;

export const MEDIA_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".tiff",
  ".tif",
  ".webp",
] as const;

export const MEDIA_VIDEO_EXTENSIONS = [
  ".mp4",
  ".mov",
  ".mkv",
  ".avi",
  ".webm",
] as const;

export const MEDIA_DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".txt",
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
] as const;

/** Executable/script extensions rejected on document uploads (BE denylist subset). */
export const MEDIA_EXECUTABLE_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".com",
  ".msi",
  ".sh",
  ".bash",
  ".ps1",
  ".vbs",
  ".js",
  ".jar",
  ".app",
  ".dmg",
  ".deb",
  ".rpm",
] as const;

export const MEDIA_TAB_ACCEPT: Record<MediaTab, string> = {
  image: ["image/*", ...MEDIA_IMAGE_EXTENSIONS].join(","),
  video: ["video/*", ...MEDIA_VIDEO_EXTENSIONS].join(","),
  document: MEDIA_DOCUMENT_EXTENSIONS.join(","),
};

/** All tabs in display order (subset passed via `visibleTabs` on the dialog). */
export const MEDIA_COLLECTION_ALL_TABS: readonly MediaTab[] = [
  "image",
  "document",
  "video",
] as const;
