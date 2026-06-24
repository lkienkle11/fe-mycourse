import {
  type InstructorCourseEditorRouteProps,
  renderInstructorCourseEditorRoute,
} from "@/components/features/instructor";

export default async function InstructorCourseReviewHistoryPage(
  props: InstructorCourseEditorRouteProps,
) {
  return renderInstructorCourseEditorRoute(props, "review-history");
}
