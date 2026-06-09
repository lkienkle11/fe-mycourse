import {
  type InstructorCourseEditorRouteProps,
  renderInstructorCourseEditorRoute,
} from "@/components/features/instructor";

export default async function InstructorCourseInfoRoute(
  props: InstructorCourseEditorRouteProps,
) {
  return renderInstructorCourseEditorRoute(props, "info");
}
