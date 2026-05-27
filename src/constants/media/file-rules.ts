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

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".mkv", ".avi", ".webm"] as const;

const DOCUMENT_EXTENSIONS = [
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
const EXECUTABLE_EXTENSIONS = [
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

export function isImageFilename(filename: string): boolean {
  const lower = filename.toLowerCase();
  return MEDIA_IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export const MEDIA_TAB_ACCEPT: Record<MediaTab, string> = {
  image: ["image/*", ...MEDIA_IMAGE_EXTENSIONS].join(","),
  video: ["video/*", ...VIDEO_EXTENSIONS].join(","),
  document: DOCUMENT_EXTENSIONS.join(","),
};

export function getMediaTabExtensions(tab: MediaTab): readonly string[] {
  switch (tab) {
    case "image":
      return MEDIA_IMAGE_EXTENSIONS;
    case "video":
      return VIDEO_EXTENSIONS;
    case "document":
      return DOCUMENT_EXTENSIONS;
  }
}

export function isExecutableExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return EXECUTABLE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
