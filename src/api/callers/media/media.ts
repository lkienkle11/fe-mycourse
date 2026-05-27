import { apiInstance } from "@/api/instance";
import { apiDelete, apiFetch } from "@/api/methods";
import { API_PRIVATE_ROUTES } from "@/constants/api-route";
import { apiListQueryToRecord, buildQueryParams } from "@/lib/utils";
import type {
  ApiPaginatedData,
  ApiPaginatedResponse,
  ApiResponse,
} from "@/types/api";
import type { MediaFile, MediaListFilters } from "@/types/media";

export function getMediaListKey(filters: MediaListFilters): string | null {
  return buildQueryParams(
    API_PRIVATE_ROUTES.media.files,
    apiListQueryToRecord(filters),
  );
}

export async function listMediaFiles(
  filters: MediaListFilters = {},
): Promise<ApiPaginatedData<MediaFile[]>> {
  const url = getMediaListKey(filters);
  if (!url) {
    throw new Error("Invalid media list URL");
  }
  const { data } = await apiFetch<ApiPaginatedResponse<MediaFile[]>>(url);
  if (!data.data) {
    throw new Error(data.message || "Failed to load media files");
  }
  return data.data;
}

export async function uploadMediaFiles(files: File[]): Promise<MediaFile[]> {
  const form = new FormData();
  for (const file of files) {
    form.append("files", file);
  }
  const { data } = await apiInstance.post<ApiResponse<MediaFile[]>>(
    API_PRIVATE_ROUTES.media.files,
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  if (!data.data) {
    throw new Error(data.message || "Failed to upload media files");
  }
  return data.data;
}

export async function deleteMediaFile(objectKey: string): Promise<void> {
  const url = buildQueryParams(API_PRIVATE_ROUTES.media.fileById, undefined, {
    objectKey,
  });
  if (!url) {
    throw new Error("Invalid media delete URL");
  }
  await apiDelete<ApiResponse<null>>(url);
}
