/**
 * Browser-bound course caller singletons.
 */

import { browserApiMethods } from "@/api/transport/browser-api-methods";
import { createCourseCallers } from "./course-factory";

const browserCourseCallers = createCourseCallers(browserApiMethods);

export const listEditableCoursesService =
  browserCourseCallers.listEditableCoursesService;
export const createCourseService = browserCourseCallers.createCourseService;
export const getCourseDetailService =
  browserCourseCallers.getCourseDetailService;
export const prepareCourseDraftService =
  browserCourseCallers.prepareCourseDraftService;
export const updateCourseBasicInfoService =
  browserCourseCallers.updateCourseBasicInfoService;
export const deleteCourseService = browserCourseCallers.deleteCourseService;
export const listCourseCollaboratorsService =
  browserCourseCallers.listCourseCollaboratorsService;
export const listCourseInstructorCandidatesService =
  browserCourseCallers.listCourseInstructorCandidatesService;
export const addCourseCollaboratorsBulkService =
  browserCourseCallers.addCourseCollaboratorsBulkService;
export const removeCourseCollaboratorService =
  browserCourseCallers.removeCourseCollaboratorService;
export const createCourseSectionService =
  browserCourseCallers.createCourseSectionService;
export const updateCourseSectionService =
  browserCourseCallers.updateCourseSectionService;
export const deleteCourseSectionService =
  browserCourseCallers.deleteCourseSectionService;
export const reorderCourseSectionsService =
  browserCourseCallers.reorderCourseSectionsService;
export const createCourseLessonService =
  browserCourseCallers.createCourseLessonService;
export const updateCourseLessonService =
  browserCourseCallers.updateCourseLessonService;
export const deleteCourseLessonService =
  browserCourseCallers.deleteCourseLessonService;
export const reorderCourseLessonsService =
  browserCourseCallers.reorderCourseLessonsService;
export const createCourseSubLessonService =
  browserCourseCallers.createCourseSubLessonService;
export const updateCourseSubLessonService =
  browserCourseCallers.updateCourseSubLessonService;
export const deleteCourseSubLessonService =
  browserCourseCallers.deleteCourseSubLessonService;
export const reorderCourseSubLessonsService =
  browserCourseCallers.reorderCourseSubLessonsService;
export const acquireCourseLeaseService =
  browserCourseCallers.acquireCourseLeaseService;
export const heartbeatCourseLeaseService =
  browserCourseCallers.heartbeatCourseLeaseService;
export const releaseCourseLeaseService =
  browserCourseCallers.releaseCourseLeaseService;
export const submitCourseReviewService =
  browserCourseCallers.submitCourseReviewService;
export const reopenCourseDraftService =
  browserCourseCallers.reopenCourseDraftService;
export const listPendingCourseReviewsService =
  browserCourseCallers.listPendingCourseReviewsService;
export const approveCourseReviewService =
  browserCourseCallers.approveCourseReviewService;
export const rejectCourseReviewService =
  browserCourseCallers.rejectCourseReviewService;
export const listCourseReviewHistoryService =
  browserCourseCallers.listCourseReviewHistoryService;
export const listPublishedCoursesService =
  browserCourseCallers.listPublishedCoursesService;
export const getLearningCourseService =
  browserCourseCallers.getLearningCourseService;
export const enrollInCourseService = browserCourseCallers.enrollInCourseService;
export const getCourseProgressService =
  browserCourseCallers.getCourseProgressService;
export const listAdminCoursesService =
  browserCourseCallers.listAdminCoursesService;
export const listTrashedCoursesService =
  browserCourseCallers.listTrashedCoursesService;
export const restoreTrashedCourseService =
  browserCourseCallers.restoreTrashedCourseService;
export const trashCourseService = browserCourseCallers.trashCourseService;
export const permanentDeleteTrashedCourseService =
  browserCourseCallers.permanentDeleteTrashedCourseService;
