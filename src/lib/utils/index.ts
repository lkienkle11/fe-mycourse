export {
  extractAxiosApiError,
  resolveApiErrorMessageKey,
  toastApiError,
  translateApiErrorCode,
} from "./api-error";
export { cn } from "./cn";
export type {
  BuildCookieOptionsInput,
  BuildHttpOnlyCookieOptionsInput,
  CookieSameSite,
} from "./cookie";
export {
  buildAuthCookieOptions,
  buildCookieOptions,
  buildHttpOnlyCookieOptions,
  getCookieDomain,
  getCookieValue,
  setCookieValue,
} from "./cookie";
export {
  createCourseBasicInfoState,
  createCourseSubLessonFormState,
  rootOutlineStableId,
  selectedIdsToMap,
} from "./course";
export type { DeltaMediaEmbed, DeltaOp, DeltaShape } from "./course-delta";
export {
  coerceToDelta,
  createEmptyDelta,
  createEmptyDeltaString,
  diffRemovedMediaEmbeds,
  extractDeltaPreviewText,
  extractMediaEmbedsFromDelta,
  extractPlainText,
  parseDelta,
  stringifyDelta,
  stripMediaEmbedsFromDelta,
} from "./course-delta";
export { filterDashboardItems } from "./dashboard";
export { formatUnixDateTime } from "./date";
export { formatBytes } from "./format-bytes";
export { apiListQueryToRecord } from "./list-query";
export type { DeltaMediaEmbedRef, MediaEmbedKind } from "./media";
export {
  classifyMediaEmbedFile,
  classifyMediaTab,
  formatMediaDate,
  getMediaDeleteKey,
  getMediaEmbedFilesFromDataTransfer,
  hasMediaEmbedFilesInDataTransfer,
  isImageMedia,
  mediaTabToCategory,
  parseMediaSortOption,
  resolveMediaCollectionDefaultTab,
  resolveVisibleMediaTabs,
  validateMediaUploadBatch,
} from "./media";
export {
  canShowWithPermissions,
  filterPermissionNavTree,
  filterUserMenuGroups,
  filterUserMenuItems,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isPermissionAction,
  isReadPermission,
  isWritePermission,
  parsePermissionName,
  permissionIdFromName,
  permissionNameFromId,
  satisfiesPermissions,
  toPermissionSet,
} from "./permission";
export { useUniqueId } from "./react";
export { isServer } from "./runtime";
export { generateSlug, slugifyName } from "./slug";
export { buildQueryParams } from "./url";
export { pickCharacter } from "./user";

// Server-only helpers (e.g. setAuthSessionCookies) live in ./auth-session.ts —
// import from "@/lib/utils/auth-session" in Server Actions only, not from this barrel.
