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
  AddCollaboratorsBulkPayload,
  AddCollaboratorsBulkResult,
  CourseCollaborator,
  CourseCollaboratorListFilters,
  CourseDetail,
  CourseInstructorCandidate,
  CourseInstructorCandidateFilters,
  CourseListItem,
  CourseSection,
  CreateCoursePayload,
  ReorderCoursePayload,
  UpdateCourseBasicInfoPayload,
  UpsertCourseLessonPayload,
  UpsertCourseSectionPayload,
  UpsertCourseSubLessonPayload,
} from "@/types/course";
import {
  courseUrl,
  getCourseCollaboratorsKey,
  getCourseDetailKey,
  getCourseInstructorCandidatesKey,
  requireUrl,
} from "./course-keys";

const routes = API_PRIVATE_ROUTES.course;

export function createCourseCoreCallers(methods: ApiMethods) {
  async function listEditableCoursesService(): Promise<CourseListItem[]> {
    const { data } = await methods.apiFetch<ApiResponse<CourseListItem[]>>(
      routes.editableList,
    );
    return data.data ?? [];
  }

  async function createCourseService(
    payload: CreateCoursePayload,
  ): Promise<CourseDetail> {
    const { data } = await methods.apiPost<
      ApiResponse<CourseDetail>,
      CreateCoursePayload
    >(routes.collection, payload);
    if (!data.data) {
      throw new Error(data.message || "Failed to create course");
    }
    return data.data;
  }

  async function getCourseDetailService(
    courseId: string,
    options?: { includeOutline?: boolean },
  ): Promise<CourseDetail> {
    const { data } = await methods.apiFetch<ApiResponse<CourseDetail>>(
      getCourseDetailKey(courseId, options),
    );
    if (!data.data) {
      throw new Error(data.message || "Failed to load course");
    }
    return data.data;
  }

  async function prepareCourseDraftService(
    courseId: string,
  ): Promise<CourseDetail> {
    const { data } = await methods.apiPost<ApiResponse<CourseDetail>>(
      courseUrl(routes.prepareDraft, courseId),
      {},
    );
    if (!data.data) {
      throw new Error(data.message || "Failed to prepare draft");
    }
    return data.data;
  }

  async function updateCourseBasicInfoService(
    courseId: string,
    payload: UpdateCourseBasicInfoPayload,
  ): Promise<CourseDetail> {
    const { data } = await methods.apiPatch<
      ApiResponse<CourseDetail>,
      UpdateCourseBasicInfoPayload
    >(courseUrl(routes.basicInfo, courseId), payload);
    if (!data.data) {
      throw new Error(data.message || "Failed to update course");
    }
    return data.data;
  }

  async function deleteCourseService(courseId: string): Promise<void> {
    await methods.apiDelete<ApiResponse<null>>(
      courseUrl(routes.byId, courseId),
    );
  }

  async function listCourseCollaboratorsService(
    courseId: string,
    filters: CourseCollaboratorListFilters = {},
  ): Promise<ApiPaginatedData<CourseCollaborator[]>> {
    const url = getCourseCollaboratorsKey(courseId, filters);
    if (!url) {
      throw new Error("Invalid collaborators URL");
    }
    const { data } =
      await methods.apiFetch<ApiPaginatedResponse<CourseCollaborator[]>>(url);
    if (!data.data) {
      throw new Error(data.message || "Failed to load collaborators");
    }
    return data.data;
  }

  async function listCourseInstructorCandidatesService(
    courseId: string,
    filters: CourseInstructorCandidateFilters = {},
  ): Promise<ApiPaginatedData<CourseInstructorCandidate[]>> {
    const url = getCourseInstructorCandidatesKey(courseId, filters);
    if (!url) {
      throw new Error("Invalid instructor candidates URL");
    }
    const { data } =
      await methods.apiFetch<ApiPaginatedResponse<CourseInstructorCandidate[]>>(
        url,
      );
    if (!data.data) {
      throw new Error(data.message || "Failed to load instructor candidates");
    }
    return data.data;
  }

  async function addCourseCollaboratorsBulkService(
    courseId: string,
    payload: AddCollaboratorsBulkPayload,
  ): Promise<AddCollaboratorsBulkResult> {
    const { data } = await methods.apiPost<
      ApiResponse<AddCollaboratorsBulkResult>,
      AddCollaboratorsBulkPayload
    >(courseUrl(routes.collaboratorsBulk, courseId), payload);
    if (!data.data) {
      throw new Error(data.message || "Failed to add collaborators");
    }
    return data.data;
  }

  async function removeCourseCollaboratorService(
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
    const { data } =
      await methods.apiDelete<ApiResponse<CourseCollaborator[]>>(url);
    if (!data.data) {
      throw new Error(data.message || "Failed to remove collaborator");
    }
    return data.data;
  }

  async function createCourseSectionService(
    courseId: string,
    payload: UpsertCourseSectionPayload,
  ): Promise<CourseSection> {
    const { data } = await methods.apiPost<
      ApiResponse<CourseSection>,
      UpsertCourseSectionPayload
    >(courseUrl(routes.sections, courseId), payload);
    if (!data.data) {
      throw new Error(data.message || "Failed to create section");
    }
    return data.data;
  }

  async function updateCourseSectionService(
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
    const { data } = await methods.apiPatch<
      ApiResponse<CourseSection>,
      UpsertCourseSectionPayload
    >(url, payload);
    if (!data.data) {
      throw new Error(data.message || "Failed to update section");
    }
    return data.data;
  }

  async function deleteCourseSectionService(
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
    const { data } = await methods.apiDelete<ApiResponse<CourseSection[]>>(url);
    if (!data.data) {
      throw new Error(data.message || "Failed to delete section");
    }
    return data.data;
  }

  async function reorderCourseSectionsService(
    courseId: string,
    payload: ReorderCoursePayload,
  ): Promise<CourseSection[]> {
    const { data } = await methods.apiPost<
      ApiResponse<CourseSection[]>,
      ReorderCoursePayload
    >(courseUrl(routes.reorderSections, courseId), payload);
    if (!data.data) {
      throw new Error(data.message || "Failed to reorder sections");
    }
    return data.data;
  }

  async function createCourseLessonService(
    courseId: string,
    payload: UpsertCourseLessonPayload,
  ) {
    const { data } = await methods.apiPost<
      ApiResponse<CourseDetail["outline"][number]["lessons"][number]>,
      UpsertCourseLessonPayload
    >(courseUrl(routes.lessons, courseId), payload);
    if (!data.data) {
      throw new Error(data.message || "Failed to create lesson");
    }
    return data.data;
  }

  async function updateCourseLessonService(
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
    const { data } = await methods.apiPatch<
      ApiResponse<CourseDetail["outline"][number]["lessons"][number]>,
      UpsertCourseLessonPayload
    >(url, payload);
    if (!data.data) {
      throw new Error(data.message || "Failed to update lesson");
    }
    return data.data;
  }

  async function deleteCourseLessonService(
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
    const { data } = await methods.apiDelete<ApiResponse<CourseSection[]>>(url);
    if (!data.data) {
      throw new Error(data.message || "Failed to delete lesson");
    }
    return data.data;
  }

  async function reorderCourseLessonsService(
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
    const { data } = await methods.apiPost<
      ApiResponse<CourseDetail["outline"][number]["lessons"]>,
      ReorderCoursePayload
    >(url, payload);
    if (!data.data) {
      throw new Error(data.message || "Failed to reorder lessons");
    }
    return data.data;
  }

  async function createCourseSubLessonService(
    courseId: string,
    payload: UpsertCourseSubLessonPayload,
  ) {
    const { data } = await methods.apiPost<
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

  async function updateCourseSubLessonService(
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
    const { data } = await methods.apiPatch<
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

  async function deleteCourseSubLessonService(
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
    const { data } = await methods.apiDelete<ApiResponse<CourseSection[]>>(url);
    if (!data.data) {
      throw new Error(data.message || "Failed to delete lesson item");
    }
    return data.data;
  }

  async function reorderCourseSubLessonsService(
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
    const { data } = await methods.apiPost<
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

  return {
    listEditableCoursesService,
    createCourseService,
    getCourseDetailService,
    prepareCourseDraftService,
    updateCourseBasicInfoService,
    deleteCourseService,
    listCourseCollaboratorsService,
    listCourseInstructorCandidatesService,
    addCourseCollaboratorsBulkService,
    removeCourseCollaboratorService,
    createCourseSectionService,
    updateCourseSectionService,
    deleteCourseSectionService,
    reorderCourseSectionsService,
    createCourseLessonService,
    updateCourseLessonService,
    deleteCourseLessonService,
    reorderCourseLessonsService,
    createCourseSubLessonService,
    updateCourseSubLessonService,
    deleteCourseSubLessonService,
    reorderCourseSubLessonsService,
  };
}
