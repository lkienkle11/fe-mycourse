/**
 * Media domain callers — isomorphic factory only.
 */

import type { ApiMethods } from "@/api/core/methods";
import { API_PRIVATE_ROUTES } from "@/constants/api-route";
import { apiListQueryToRecord, buildQueryParams } from "@/lib/utils";
import type {
  ApiPaginatedData,
  ApiPaginatedResponse,
  ApiResponse,
} from "@/types/api";
import type { MediaFile, MediaListFilters } from "@/types/media";

/** Multipart upload needs longer than the authenticated default (10s). */
const MEDIA_UPLOAD_TIMEOUT_MS = 30_000;

export function getMediaListKey(filters: MediaListFilters): string | null {
  return buildQueryParams(
    API_PRIVATE_ROUTES.media.files,
    apiListQueryToRecord(filters),
  );
}

export function createMediaCallers(methods: ApiMethods) {
  return {
    async listMediaFiles(
      filters: MediaListFilters = {},
    ): Promise<ApiPaginatedData<MediaFile[]>> {
      const url = getMediaListKey(filters);
      if (!url) {
        throw new Error("Invalid media list URL");
      }
      const { data } =
        await methods.apiFetch<ApiPaginatedResponse<MediaFile[]>>(url);
      if (!data.data) {
        throw new Error(data.message || "Failed to load media files");
      }
      return data.data;
    },

    async uploadMediaFiles(
      files: File[],
      options?: { visibility?: "private" | "public" },
    ): Promise<MediaFile[]> {
      const form = new FormData();
      for (const file of files) {
        form.append("files", file);
      }
      form.append("visibility", options?.visibility ?? "private");
      const { data } = await methods.apiPost<
        ApiResponse<MediaFile[]>,
        FormData
      >(API_PRIVATE_ROUTES.media.files, form, {
        timeout: MEDIA_UPLOAD_TIMEOUT_MS,
      });
      if (!data.data) {
        throw new Error(data.message || "Failed to upload media files");
      }
      return data.data;
    },

    async deleteMediaFile(objectKey: string): Promise<void> {
      const url = buildQueryParams(
        API_PRIVATE_ROUTES.media.fileById,
        undefined,
        { objectKey },
      );
      if (!url) {
        throw new Error("Invalid media delete URL");
      }
      await methods.apiDelete<ApiResponse<null>>(url);
    },
  };
}
