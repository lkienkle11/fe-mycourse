import {
  type InstructorCourseEditorRouteProps,
  renderInstructorCourseEditorRoute,
} from "@/components/features/instructor";

export default async function InstructorCoursePricingRoute(
  props: InstructorCourseEditorRouteProps,
) {
  return renderInstructorCourseEditorRoute(props, "pricing");
}
