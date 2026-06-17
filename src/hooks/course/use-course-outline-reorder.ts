"use client";

import { toast } from "sonner";
import type { KeyedMutator } from "swr";
import {
  reorderCourseLessonsService,
  reorderCourseSectionsService,
  reorderCourseSubLessonsService,
} from "@/api/callers/course";
import { type ApiErrorCodeKey, toastApiError } from "@/lib/utils/api-error";
import {
  assignSequentialOrderIndex,
  mergeReorderedLessons,
  mergeReorderedSections,
  mergeReorderedSubLessons,
  replaceLessonSubLessons,
  replaceSectionLessons,
  rootOutlineStableId,
  withOutlineSections,
} from "@/lib/utils/course";
import type {
  CourseDetail,
  CourseLesson,
  CourseResourceType,
  CourseSection,
  CourseSubLesson,
} from "@/types/course";

type UseCourseOutlineReorderParams = {
  courseId: string;
  courseDetail?: CourseDetail;
  mutateDetail: KeyedMutator<CourseDetail>;
  acquireLease: (
    resourceType: CourseResourceType,
    resourceStableId: string,
  ) => Promise<unknown>;
  releaseLease: () => Promise<void>;
  tSuccess: (
    key: "sectionsReordered" | "lessonsReordered" | "itemsReordered",
  ) => string;
  tErrors: (key: ApiErrorCodeKey) => string;
};

export function useCourseOutlineReorder({
  courseId,
  courseDetail,
  mutateDetail,
  acquireLease,
  releaseLease,
  tSuccess,
  tErrors,
}: UseCourseOutlineReorderParams) {
  const runOptimisticOutlineReorder = async <TResult>({
    nextOutline,
    resourceType,
    resourceStableId,
    persist,
    mergeSuccess,
    successMessage,
  }: {
    nextOutline: CourseSection[];
    resourceType: CourseResourceType;
    resourceStableId: string;
    persist: () => Promise<TResult>;
    mergeSuccess: (detail: CourseDetail, result: TResult) => CourseDetail;
    successMessage: string;
  }) => {
    if (!courseDetail) {
      return;
    }
    const snapshot = courseDetail;
    await mutateDetail(withOutlineSections(courseDetail, nextOutline), {
      revalidate: false,
    });

    const lease = await acquireLease(resourceType, resourceStableId);
    if (!lease) {
      await mutateDetail(snapshot, { revalidate: false });
      return;
    }

    try {
      const result = await persist();
      await mutateDetail(
        (current) => (current ? mergeSuccess(current, result) : current),
        { revalidate: false },
      );
      toast.success(successMessage);
    } catch (error) {
      await mutateDetail(snapshot, { revalidate: false });
      toastApiError(tErrors, error);
    } finally {
      await releaseLease();
    }
  };

  const handleReorderSections = (sections: CourseSection[]) => {
    void runOptimisticOutlineReorder({
      nextOutline: assignSequentialOrderIndex(sections),
      resourceType: "OUTLINE_ROOT",
      resourceStableId: rootOutlineStableId(courseId),
      persist: () =>
        reorderCourseSectionsService(courseId, {
          ordered_stable_ids: sections.map((section) => section.stable_id),
        }),
      mergeSuccess: (detail, apiSections) =>
        withOutlineSections(
          detail,
          mergeReorderedSections(detail.outline, apiSections),
        ),
      successMessage: tSuccess("sectionsReordered"),
    });
  };

  const handleReverseSections = (outline: CourseSection[]) => {
    handleReorderSections(outline.slice().reverse());
  };

  const handleReorderLessons = (
    section: CourseSection,
    lessons: CourseLesson[],
  ) => {
    if (!courseDetail) {
      return;
    }
    void runOptimisticOutlineReorder({
      nextOutline: replaceSectionLessons(
        courseDetail.outline,
        section.id,
        lessons,
      ),
      resourceType: "SECTION",
      resourceStableId: section.stable_id,
      persist: () =>
        reorderCourseLessonsService(courseId, section.id, {
          ordered_stable_ids: lessons.map((lesson) => lesson.stable_id),
        }),
      mergeSuccess: (detail, apiLessons) =>
        withOutlineSections(
          detail,
          mergeReorderedLessons(detail.outline, section.id, apiLessons),
        ),
      successMessage: tSuccess("lessonsReordered"),
    });
  };

  const handleReorderSubLessons = (
    lesson: CourseLesson,
    subLessons: CourseSubLesson[],
  ) => {
    if (!courseDetail) {
      return;
    }
    void runOptimisticOutlineReorder({
      nextOutline: replaceLessonSubLessons(
        courseDetail.outline,
        lesson.id,
        subLessons,
      ),
      resourceType: "LESSON",
      resourceStableId: lesson.stable_id,
      persist: () =>
        reorderCourseSubLessonsService(courseId, lesson.id, {
          ordered_stable_ids: subLessons.map(
            (subLesson) => subLesson.stable_id,
          ),
        }),
      mergeSuccess: (detail, apiSubLessons) =>
        withOutlineSections(
          detail,
          mergeReorderedSubLessons(detail.outline, lesson.id, apiSubLessons),
        ),
      successMessage: tSuccess("itemsReordered"),
    });
  };

  return {
    handleReorderSections,
    handleReverseSections,
    handleReorderLessons,
    handleReorderSubLessons,
  };
}
