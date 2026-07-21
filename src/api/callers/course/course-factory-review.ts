/**
 * Course callers factory parts (request-scoped ApiMethods binding).
 */

import type { ApiMethods } from "@/api/core/methods";
import { API_PRIVATE_ROUTES } from "@/constants/api-route";
import { buildQueryParams } from "@/lib/utils";
import type {
  ApiPaginatedData,
  ApiPaginatedResponse,
  ApiResponse,
} from "@/types/api";
import type {
  AcquireCourseLeasePayload,
  ApproveCourseDraftPayload,
  CourseDetail,
  CourseEnrollment,
  CourseLease,
  CourseListItem,
  CourseProgress,
  CourseReviewHistoryFilters,
  CourseReviewHistoryItem,
  RejectCourseDraftPayload,
  ReleaseCourseLeasePayload,
} from "@/types/course";
import {
  courseUrl,
  getCourseReviewHistoryKey,
  requireUrl,
} from "./course-keys";

const routes = API_PRIVATE_ROUTES.course;

export function createCourseReviewCallers(methods: ApiMethods) {
  async function acquireCourseLeaseService(
    courseId: string,
    payload: AcquireCourseLeasePayload,
  ): Promise<CourseLease> {
    const { data } = await methods.apiPost<
      ApiResponse<CourseLease>,
      AcquireCourseLeasePayload
    >(courseUrl(routes.acquireLease, courseId), payload);
    if (!data.data) {
      throw new Error(data.message || "Failed to acquire editor lock");
    }
    return data.data;
  }

  async function heartbeatCourseLeaseService(
    courseId: string,
    leaseToken: string,
  ): Promise<CourseLease> {
    const { data } = await methods.apiPost<
      ApiResponse<CourseLease>,
      ReleaseCourseLeasePayload
    >(courseUrl(routes.heartbeatLease, courseId), { lease_token: leaseToken });
    if (!data.data) {
      throw new Error(data.message || "Failed to refresh editor lock");
    }
    return data.data;
  }

  async function releaseCourseLeaseService(
    courseId: string,
    payload: ReleaseCourseLeasePayload,
  ): Promise<void> {
    await methods.apiPost<ApiResponse<null>, ReleaseCourseLeasePayload>(
      courseUrl(routes.releaseLease, courseId),
      payload,
    );
  }

  async function submitCourseReviewService(
    courseId: string,
  ): Promise<CourseDetail> {
    const { data } = await methods.apiPost<ApiResponse<CourseDetail>>(
      courseUrl(routes.submitReview, courseId),
      {},
    );
    if (!data.data) {
      throw new Error(data.message || "Failed to submit review");
    }
    return data.data;
  }

  async function reopenCourseDraftService(
    courseId: string,
  ): Promise<CourseDetail> {
    const { data } = await methods.apiPost<ApiResponse<CourseDetail>>(
      courseUrl(routes.reopenDraft, courseId),
      {},
    );
    if (!data.data) {
      throw new Error(data.message || "Failed to reopen draft");
    }
    return data.data;
  }

  async function listPendingCourseReviewsService(): Promise<CourseListItem[]> {
    const { data } = await methods.apiFetch<ApiResponse<CourseListItem[]>>(
      routes.pendingReviews,
    );
    return data.data ?? [];
  }

  async function approveCourseReviewService(
    courseId: string,
    payload: ApproveCourseDraftPayload,
  ): Promise<CourseDetail> {
    const url = requireUrl(
      buildQueryParams(routes.approveReview, undefined, {
        courseId: String(courseId),
      }),
      "Invalid approve URL",
    );
    const { data } = await methods.apiPost<
      ApiResponse<CourseDetail>,
      ApproveCourseDraftPayload
    >(url, payload);
    if (!data.data) {
      throw new Error(data.message || "Failed to approve course");
    }
    return data.data;
  }

  async function rejectCourseReviewService(
    courseId: string,
    payload: RejectCourseDraftPayload,
  ): Promise<CourseDetail> {
    const url = requireUrl(
      buildQueryParams(routes.rejectReview, undefined, {
        courseId: String(courseId),
      }),
      "Invalid reject URL",
    );
    const { data } = await methods.apiPost<
      ApiResponse<CourseDetail>,
      RejectCourseDraftPayload
    >(url, payload);
    if (!data.data) {
      throw new Error(data.message || "Failed to reject course");
    }
    return data.data;
  }

  async function listCourseReviewHistoryService(
    courseId: string,
    filters: CourseReviewHistoryFilters = {},
  ): Promise<ApiPaginatedData<CourseReviewHistoryItem[]>> {
    const url = getCourseReviewHistoryKey(courseId, filters);
    if (!url) {
      throw new Error("Invalid review history URL");
    }
    const { data } =
      await methods.apiFetch<ApiPaginatedResponse<CourseReviewHistoryItem[]>>(
        url,
      );
    if (!data.data) {
      throw new Error(data.message || "Failed to load review history");
    }
    return data.data;
  }

  async function listPublishedCoursesService(): Promise<CourseListItem[]> {
    const { data } = await methods.apiFetch<ApiResponse<CourseListItem[]>>(
      routes.learnerCollection,
    );
    return data.data ?? [];
  }

  async function getLearningCourseService(
    courseId: string,
  ): Promise<CourseDetail> {
    const { data } = await methods.apiFetch<ApiResponse<CourseDetail>>(
      courseUrl(routes.learnerById, courseId),
    );
    if (!data.data) {
      throw new Error(data.message || "Failed to load learning course");
    }
    return data.data;
  }

  async function enrollInCourseService(
    courseId: string,
  ): Promise<CourseEnrollment> {
    const { data } = await methods.apiPost<ApiResponse<CourseEnrollment>>(
      courseUrl(routes.learnerEnroll, courseId),
      {},
    );
    if (!data.data) {
      throw new Error(data.message || "Failed to enroll in course");
    }
    return data.data;
  }

  async function getCourseProgressService(
    courseId: string,
  ): Promise<CourseProgress> {
    const { data } = await methods.apiFetch<ApiResponse<CourseProgress>>(
      courseUrl(routes.learnerProgress, courseId),
    );
    if (!data.data) {
      throw new Error(data.message || "Failed to load progress");
    }
    return data.data;
  }

  async function listAdminCoursesService(): Promise<CourseListItem[]> {
    const { data } = await methods.apiFetch<ApiResponse<CourseListItem[]>>(
      routes.adminCourses,
    );
    return data.data ?? [];
  }

  async function listTrashedCoursesService(): Promise<CourseListItem[]> {
    const { data } = await methods.apiFetch<ApiResponse<CourseListItem[]>>(
      routes.adminCoursesTrash,
    );
    return data.data ?? [];
  }

  async function restoreTrashedCourseService(courseId: string): Promise<void> {
    const url = requireUrl(
      buildQueryParams(routes.adminCourseRestore, undefined, {
        courseId: String(courseId),
      }),
      "Invalid restore URL",
    );
    await methods.apiPost(url, {});
  }

  async function trashCourseService(courseId: string): Promise<void> {
    const url = requireUrl(
      buildQueryParams(routes.adminCourseTrash, undefined, {
        courseId: String(courseId),
      }),
      "Invalid trash URL",
    );
    await methods.apiPost(url, {});
  }

  async function permanentDeleteTrashedCourseService(
    courseId: string,
  ): Promise<void> {
    const url = requireUrl(
      buildQueryParams(routes.adminCoursePermanentDelete, undefined, {
        courseId: String(courseId),
      }),
      "Invalid permanent delete URL",
    );
    await methods.apiDelete(url);
  }

  return {
    acquireCourseLeaseService,
    heartbeatCourseLeaseService,
    releaseCourseLeaseService,
    submitCourseReviewService,
    reopenCourseDraftService,
    listPendingCourseReviewsService,
    approveCourseReviewService,
    rejectCourseReviewService,
    listCourseReviewHistoryService,
    listPublishedCoursesService,
    getLearningCourseService,
    enrollInCourseService,
    getCourseProgressService,
    listAdminCoursesService,
    listTrashedCoursesService,
    restoreTrashedCourseService,
    trashCourseService,
    permanentDeleteTrashedCourseService,
  };
}
