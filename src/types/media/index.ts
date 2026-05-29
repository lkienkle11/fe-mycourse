import type { ApiListQueryParams } from "@/types/api";

/** UI tab keys for the media collection dialog. */
export type MediaTab = "image" | "document" | "video";

/** BE list `category` query param (same values as MediaTab). */
export type MediaCategory = MediaTab;

export type MediaSortBy =
  | "created_at"
  | "updated_at"
  | "filename"
  | "size_bytes";

export type MediaSortOrder = "asc" | "desc";

/** Shared pagination/sort fields via `apiListQueryToRecord()`; media-specific `category` + `sort_order`. */
export type MediaListFilters = ApiListQueryParams & {
  category?: MediaCategory;
  sort_by?: MediaSortBy;
  sort_order?: MediaSortOrder;
};

/** Mirrors BE `UploadFileMetadata`. */
export type MediaFileMetadata = {
  size_bytes?: number;
  width_bytes?: number;
  height_bytes?: number;
  mime_type?: string;
  extension?: string;
  duration_seconds?: number;
};

/** Mirrors BE `UploadFileResponse`. */
export type MediaFile = {
  id?: string;
  kind?: string;
  filename?: string;
  mime_type?: string;
  size_bytes?: number;
  status?: string;
  url: string;
  object_key: string;
  thumbnail_url?: string;
  embeded_html?: string;
  duration?: number;
  metadata?: MediaFileMetadata;
  row_version?: number;
  created_at?: number;
  updated_at?: number;
};

export type MediaSortOption = "filename_asc" | "created_at_desc";
