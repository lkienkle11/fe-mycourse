"use client";

import useSWR from "swr";
import {
  getCourseDetailKey,
  getCourseDetailService,
  getCourseReviewQueueKey,
  getEditableCoursesKey,
  getLearningCourseService,
  listEditableCoursesService,
  listPendingCourseReviewsService,
  listPublishedCoursesService,
} from "@/api/callers/course";
import type { CourseDetail, CourseListItem } from "@/types/course";

export function useEditableCourses() {
  const swr = useSWR<CourseListItem[]>(
    getEditableCoursesKey(),
    listEditableCoursesService,
    { revalidateOnFocus: true },
  );

  return {
    rows: swr.data ?? [],
    isLoading: swr.isLoading,
    error: swr.error,
    mutate: swr.mutate,
  };
}

export function useCourseDetail(courseId: number | null) {
  const key = courseId ? getCourseDetailKey(courseId) : null;
  const swr = useSWR<CourseDetail>(
    key,
    () => getCourseDetailService(courseId as number),
    { revalidateOnFocus: true },
  );

  return {
    data: swr.data,
    isLoading: swr.isLoading,
    error: swr.error,
    mutate: swr.mutate,
  };
}

export function useCourseReviewQueue() {
  const swr = useSWR<CourseListItem[]>(
    getCourseReviewQueueKey(),
    listPendingCourseReviewsService,
    { revalidateOnFocus: true },
  );

  return {
    rows: swr.data ?? [],
    isLoading: swr.isLoading,
    error: swr.error,
    mutate: swr.mutate,
  };
}

export function usePublishedCourses() {
  const swr = useSWR<CourseListItem[]>(
    "published-courses",
    listPublishedCoursesService,
    { revalidateOnFocus: true },
  );

  return {
    rows: swr.data ?? [],
    isLoading: swr.isLoading,
    error: swr.error,
    mutate: swr.mutate,
  };
}

export function useLearningCourse(courseId: number | null) {
  const swr = useSWR<CourseDetail>(
    courseId ? `learning-course-${courseId}` : null,
    () => getLearningCourseService(courseId as number),
    { revalidateOnFocus: true },
  );

  return {
    data: swr.data,
    isLoading: swr.isLoading,
    error: swr.error,
    mutate: swr.mutate,
  };
}
