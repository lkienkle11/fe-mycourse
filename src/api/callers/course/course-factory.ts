/**
 * Course callers factory (request-scoped ApiMethods binding).
 */

import type { ApiMethods } from "@/api/core/methods";
import { createCourseCoreCallers } from "./course-factory-core";
import { createCourseReviewCallers } from "./course-factory-review";

export function createCourseCallers(methods: ApiMethods) {
  return {
    ...createCourseCoreCallers(methods),
    ...createCourseReviewCallers(methods),
  };
}
