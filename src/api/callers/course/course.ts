import { apiDelete, apiFetch, apiPatch, apiPost } from "@/api/methods";
import { API_PRIVATE_ROUTES } from "@/constants/api-route";
import { buildQueryParams } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type {
  AcquireCourseLeasePayload,
  CourseCollaborator,
  CourseDetail,
  CourseEnrollment,
  CourseLease,
  CourseListItem,
  CourseProgress,
  CourseSection,
  CreateCoursePayload,
  RejectCourseDraftPayload,
  ReleaseCourseLeasePayload,
  ReorderCoursePayload,
  UpdateCourseBasicInfoPayload,
  UpsertCourseLessonPayload,
  UpsertCourseSectionPayload,
  UpsertCourseSubLessonPayload,
} from "@/types/course";

const routes = API_PRIVATE_ROUTES.course;

function requireUrl(url: string | null, message: string): string {
  if (!url) {
    throw new Error(message);
  }
  return url;
}

function courseUrl(
  path: string,
  courseId: string,
  extra?: Record<string, string>,
) {
  return requireUrl(
    buildQueryParams(path, undefined, {
      courseId: String(courseId),
      ...extra,
    }),
    "Invalid course URL",
  );
}

export function getEditableCoursesKey(): string {
  return routes.editableList;
}

export async function listEditableCoursesService(): Promise<CourseListItem[]> {
  const { data } = await apiFetch<ApiResponse<CourseListItem[]>>(
    routes.editableList,
  );
  return data.data ?? [];
}

export function getCourseDetailKey(courseId: string): string {
  return courseUrl(routes.byId, courseId);
}

export async function createCourseService(
  payload: CreateCoursePayload,
): Promise<CourseDetail> {
  const { data } = await apiPost<
    ApiResponse<CourseDetail>,
    CreateCoursePayload
  >(routes.collection, payload);
  if (!data.data) {
    throw new Error(data.message || "Failed to create course");
  }
  return data.data;
}

export async function getCourseDetailService(
  courseId: string,
): Promise<CourseDetail> {
  const { data } = await apiFetch<ApiResponse<CourseDetail>>(
    getCourseDetailKey(courseId),
  );
  if (!data.data) {
    throw new Error(data.message || "Failed to load course");
  }
  return data.data;
}

export async function prepareCourseDraftService(
  courseId: string,
): Promise<CourseDetail> {
  const { data } = await apiPost<ApiResponse<CourseDetail>>(
    courseUrl(routes.prepareDraft, courseId),
    {},
  );
  if (!data.data) {
    throw new Error(data.message || "Failed to prepare draft");
  }
  return data.data;
}

export async function updateCourseBasicInfoService(
  courseId: string,
  payload: UpdateCourseBasicInfoPayload,
): Promise<CourseDetail> {
  const { data } = await apiPatch<
    ApiResponse<CourseDetail>,
    UpdateCourseBasicInfoPayload
  >(courseUrl(routes.basicInfo, courseId), payload);
  if (!data.data) {
    throw new Error(data.message || "Failed to update course");
  }
  return data.data;
}

export async function deleteCourseService(courseId: string): Promise<void> {
  await apiDelete<ApiResponse<null>>(courseUrl(routes.byId, courseId));
}

export async function listCourseCollaboratorsService(
  courseId: string,
): Promise<CourseCollaborator[]> {
  const { data } = await apiFetch<ApiResponse<CourseCollaborator[]>>(
    courseUrl(routes.collaborators, courseId),
  );
  return data.data ?? [];
}

export async function addCourseCollaboratorService(
  courseId: string,
  payload: { user_id: string; role: "OWNER" | "EDITOR" },
): Promise<CourseCollaborator[]> {
  const { data } = await apiPost<
    ApiResponse<CourseCollaborator[]>,
    { user_id: string; role: "OWNER" | "EDITOR" }
  >(courseUrl(routes.collaborators, courseId), payload);
  if (!data.data) {
    throw new Error(data.message || "Failed to add collaborator");
  }
  return data.data;
}

export async function removeCourseCollaboratorService(
  courseId: string,
  userId: string,
): Promise<CourseCollaborator[]> {
  const url = requireUrl(
    buildQueryParams(routes.collaboratorByUser, undefined, {
      courseId: String(courseId),
      userId: String(userId),
    }),
    "Invalid collaborator URL",
  );
  const { data } = await apiDelete<ApiResponse<CourseCollaborator[]>>(url);
  if (!data.data) {
    throw new Error(data.message || "Failed to remove collaborator");
  }
  return data.data;
}

export async function createCourseSectionService(
  courseId: string,
  payload: UpsertCourseSectionPayload,
): Promise<CourseSection> {
  const { data } = await apiPost<
    ApiResponse<CourseSection>,
    UpsertCourseSectionPayload
  >(courseUrl(routes.sections, courseId), payload);
  if (!data.data) {
    throw new Error(data.message || "Failed to create section");
  }
  return data.data;
}

export async function updateCourseSectionService(
  courseId: string,
  sectionId: string,
  payload: UpsertCourseSectionPayload,
): Promise<CourseSection> {
  const url = requireUrl(
    buildQueryParams(routes.sectionById, undefined, {
      courseId: String(courseId),
      sectionId: String(sectionId),
    }),
    "Invalid section URL",
  );
  const { data } = await apiPatch<
    ApiResponse<CourseSection>,
    UpsertCourseSectionPayload
  >(url, payload);
  if (!data.data) {
    throw new Error(data.message || "Failed to update section");
  }
  return data.data;
}

export async function deleteCourseSectionService(
  courseId: string,
  sectionId: string,
): Promise<CourseSection[]> {
  const url = requireUrl(
    buildQueryParams(routes.sectionById, undefined, {
      courseId: String(courseId),
      sectionId: String(sectionId),
    }),
    "Invalid section delete URL",
  );
  const { data } = await apiDelete<ApiResponse<CourseSection[]>>(url);
  if (!data.data) {
    throw new Error(data.message || "Failed to delete section");
  }
  return data.data;
}

export async function reorderCourseSectionsService(
  courseId: string,
  payload: ReorderCoursePayload,
): Promise<CourseSection[]> {
  const { data } = await apiPost<
    ApiResponse<CourseSection[]>,
    ReorderCoursePayload
  >(courseUrl(routes.reorderSections, courseId), payload);
  if (!data.data) {
    throw new Error(data.message || "Failed to reorder sections");
  }
  return data.data;
}

export async function createCourseLessonService(
  courseId: string,
  payload: UpsertCourseLessonPayload,
) {
  const { data } = await apiPost<
    ApiResponse<CourseDetail["outline"][number]["lessons"][number]>,
    UpsertCourseLessonPayload
  >(courseUrl(routes.lessons, courseId), payload);
  if (!data.data) {
    throw new Error(data.message || "Failed to create lesson");
  }
  return data.data;
}

export async function updateCourseLessonService(
  courseId: string,
  lessonId: string,
  payload: UpsertCourseLessonPayload,
) {
  const url = requireUrl(
    buildQueryParams(routes.lessonById, undefined, {
      courseId: String(courseId),
      lessonId: String(lessonId),
    }),
    "Invalid lesson URL",
  );
  const { data } = await apiPatch<
    ApiResponse<CourseDetail["outline"][number]["lessons"][number]>,
    UpsertCourseLessonPayload
  >(url, payload);
  if (!data.data) {
    throw new Error(data.message || "Failed to update lesson");
  }
  return data.data;
}

export async function deleteCourseLessonService(
  courseId: string,
  lessonId: string,
): Promise<CourseSection[]> {
  const url = requireUrl(
    buildQueryParams(routes.lessonById, undefined, {
      courseId: String(courseId),
      lessonId: String(lessonId),
    }),
    "Invalid lesson delete URL",
  );
  const { data } = await apiDelete<ApiResponse<CourseSection[]>>(url);
  if (!data.data) {
    throw new Error(data.message || "Failed to delete lesson");
  }
  return data.data;
}

export async function reorderCourseLessonsService(
  courseId: string,
  sectionId: string,
  payload: ReorderCoursePayload,
) {
  const url = requireUrl(
    buildQueryParams(routes.reorderLessons, undefined, {
      courseId: String(courseId),
      sectionId: String(sectionId),
    }),
    "Invalid lesson reorder URL",
  );
  const { data } = await apiPost<
    ApiResponse<CourseDetail["outline"][number]["lessons"]>,
    ReorderCoursePayload
  >(url, payload);
  if (!data.data) {
    throw new Error(data.message || "Failed to reorder lessons");
  }
  return data.data;
}

export async function createCourseSubLessonService(
  courseId: string,
  payload: UpsertCourseSubLessonPayload,
) {
  const { data } = await apiPost<
    ApiResponse<
      CourseDetail["outline"][number]["lessons"][number]["sub_lessons"][number]
    >,
    UpsertCourseSubLessonPayload
  >(courseUrl(routes.subLessons, courseId), payload);
  if (!data.data) {
    throw new Error(data.message || "Failed to create lesson item");
  }
  return data.data;
}

export async function updateCourseSubLessonService(
  courseId: string,
  subLessonId: string,
  payload: UpsertCourseSubLessonPayload,
) {
  const url = requireUrl(
    buildQueryParams(routes.subLessonById, undefined, {
      courseId: String(courseId),
      subLessonId: String(subLessonId),
    }),
    "Invalid sub-lesson URL",
  );
  const { data } = await apiPatch<
    ApiResponse<
      CourseDetail["outline"][number]["lessons"][number]["sub_lessons"][number]
    >,
    UpsertCourseSubLessonPayload
  >(url, payload);
  if (!data.data) {
    throw new Error(data.message || "Failed to update lesson item");
  }
  return data.data;
}

export async function deleteCourseSubLessonService(
  courseId: string,
  subLessonId: string,
): Promise<CourseSection[]> {
  const url = requireUrl(
    buildQueryParams(routes.subLessonById, undefined, {
      courseId: String(courseId),
      subLessonId: String(subLessonId),
    }),
    "Invalid sub-lesson delete URL",
  );
  const { data } = await apiDelete<ApiResponse<CourseSection[]>>(url);
  if (!data.data) {
    throw new Error(data.message || "Failed to delete lesson item");
  }
  return data.data;
}

export async function reorderCourseSubLessonsService(
  courseId: string,
  lessonId: string,
  payload: ReorderCoursePayload,
) {
  const url = requireUrl(
    buildQueryParams(routes.reorderSubLessons, undefined, {
      courseId: String(courseId),
      lessonId: String(lessonId),
    }),
    "Invalid sub-lesson reorder URL",
  );
  const { data } = await apiPost<
    ApiResponse<
      CourseDetail["outline"][number]["lessons"][number]["sub_lessons"]
    >,
    ReorderCoursePayload
  >(url, payload);
  if (!data.data) {
    throw new Error(data.message || "Failed to reorder lesson items");
  }
  return data.data;
}

export async function acquireCourseLeaseService(
  courseId: string,
  payload: AcquireCourseLeasePayload,
): Promise<CourseLease> {
  const { data } = await apiPost<
    ApiResponse<CourseLease>,
    AcquireCourseLeasePayload
  >(courseUrl(routes.acquireLease, courseId), payload);
  if (!data.data) {
    throw new Error(data.message || "Failed to acquire editor lock");
  }
  return data.data;
}

export async function heartbeatCourseLeaseService(
  courseId: string,
  leaseToken: string,
): Promise<CourseLease> {
  const { data } = await apiPost<
    ApiResponse<CourseLease>,
    ReleaseCourseLeasePayload
  >(courseUrl(routes.heartbeatLease, courseId), { lease_token: leaseToken });
  if (!data.data) {
    throw new Error(data.message || "Failed to refresh editor lock");
  }
  return data.data;
}

export async function releaseCourseLeaseService(
  courseId: string,
  payload: ReleaseCourseLeasePayload,
): Promise<void> {
  await apiPost<ApiResponse<null>, ReleaseCourseLeasePayload>(
    courseUrl(routes.releaseLease, courseId),
    payload,
  );
}

export async function submitCourseReviewService(
  courseId: string,
): Promise<CourseDetail> {
  const { data } = await apiPost<ApiResponse<CourseDetail>>(
    courseUrl(routes.submitReview, courseId),
    {},
  );
  if (!data.data) {
    throw new Error(data.message || "Failed to submit review");
  }
  return data.data;
}

export async function reopenCourseDraftService(
  courseId: string,
): Promise<CourseDetail> {
  const { data } = await apiPost<ApiResponse<CourseDetail>>(
    courseUrl(routes.reopenDraft, courseId),
    {},
  );
  if (!data.data) {
    throw new Error(data.message || "Failed to reopen draft");
  }
  return data.data;
}

export function getCourseReviewQueueKey(): string {
  return routes.pendingReviews;
}

export async function listPendingCourseReviewsService(): Promise<
  CourseListItem[]
> {
  const { data } = await apiFetch<ApiResponse<CourseListItem[]>>(
    routes.pendingReviews,
  );
  return data.data ?? [];
}

export async function approveCourseReviewService(
  courseId: string,
): Promise<CourseDetail> {
  const url = requireUrl(
    buildQueryParams(routes.approveReview, undefined, {
      courseId: String(courseId),
    }),
    "Invalid approve URL",
  );
  const { data } = await apiPost<ApiResponse<CourseDetail>>(url, {});
  if (!data.data) {
    throw new Error(data.message || "Failed to approve course");
  }
  return data.data;
}

export async function rejectCourseReviewService(
  courseId: string,
  payload: RejectCourseDraftPayload,
): Promise<CourseDetail> {
  const url = requireUrl(
    buildQueryParams(routes.rejectReview, undefined, {
      courseId: String(courseId),
    }),
    "Invalid reject URL",
  );
  const { data } = await apiPost<
    ApiResponse<CourseDetail>,
    RejectCourseDraftPayload
  >(url, payload);
  if (!data.data) {
    throw new Error(data.message || "Failed to reject course");
  }
  return data.data;
}

export async function listPublishedCoursesService(): Promise<CourseListItem[]> {
  const { data } = await apiFetch<ApiResponse<CourseListItem[]>>(
    routes.learnerCollection,
  );
  return data.data ?? [];
}

export async function getLearningCourseService(
  courseId: string,
): Promise<CourseDetail> {
  const { data } = await apiFetch<ApiResponse<CourseDetail>>(
    courseUrl(routes.learnerById, courseId),
  );
  if (!data.data) {
    throw new Error(data.message || "Failed to load learning course");
  }
  return data.data;
}

export async function enrollInCourseService(
  courseId: string,
): Promise<CourseEnrollment> {
  const { data } = await apiPost<ApiResponse<CourseEnrollment>>(
    courseUrl(routes.learnerEnroll, courseId),
    {},
  );
  if (!data.data) {
    throw new Error(data.message || "Failed to enroll in course");
  }
  return data.data;
}

export async function getCourseProgressService(
  courseId: string,
): Promise<CourseProgress> {
  const { data } = await apiFetch<ApiResponse<CourseProgress>>(
    courseUrl(routes.learnerProgress, courseId),
  );
  if (!data.data) {
    throw new Error(data.message || "Failed to load progress");
  }
  return data.data;
}

export type AdminCourseApprovalFilter = "all" | "approved";

export function getAdminCoursesKey(
  approval: AdminCourseApprovalFilter = "all",
): string {
  return `${routes.adminCourses}?approval=${approval}`;
}

export function getTrashedCoursesKey(): string {
  return routes.adminCoursesTrash;
}

export async function listAdminCoursesService(
  approval: AdminCourseApprovalFilter = "all",
): Promise<CourseListItem[]> {
  const url =
    approval === "approved"
      ? `${routes.adminCourses}?approval=approved`
      : routes.adminCourses;
  const { data } = await apiFetch<ApiResponse<CourseListItem[]>>(url);
  return data.data ?? [];
}

export async function listTrashedCoursesService(): Promise<CourseListItem[]> {
  const { data } = await apiFetch<ApiResponse<CourseListItem[]>>(
    routes.adminCoursesTrash,
  );
  return data.data ?? [];
}

export async function restoreTrashedCourseService(
  courseId: string,
): Promise<void> {
  const url = requireUrl(
    buildQueryParams(routes.adminCourseRestore, undefined, {
      courseId: String(courseId),
    }),
    "Invalid restore URL",
  );
  await apiPost(url, {});
}

export async function trashCourseService(courseId: string): Promise<void> {
  const url = requireUrl(
    buildQueryParams(routes.adminCourseTrash, undefined, {
      courseId: String(courseId),
    }),
    "Invalid trash URL",
  );
  await apiPost(url, {});
}

export async function permanentDeleteTrashedCourseService(
  courseId: string,
): Promise<void> {
  const url = requireUrl(
    buildQueryParams(routes.adminCoursePermanentDelete, undefined, {
      courseId: String(courseId),
    }),
    "Invalid permanent delete URL",
  );
  await apiDelete(url);
}
