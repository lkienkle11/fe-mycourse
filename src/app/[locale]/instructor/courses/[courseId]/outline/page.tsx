import {
  type InstructorCourseEditorRouteProps,
  renderInstructorCourseEditorRoute,
} from "@/components/features/instructor";

export default async function InstructorCourseOutlineRoute(
  props: InstructorCourseEditorRouteProps,
) {
  return renderInstructorCourseEditorRoute(props, "outline");
}
