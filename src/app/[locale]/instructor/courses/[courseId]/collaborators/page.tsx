import {
  type InstructorCourseEditorRouteProps,
  renderInstructorCourseEditorRoute,
} from "@/components/features/instructor";

export default async function InstructorCourseCollaboratorsRoute(
  props: InstructorCourseEditorRouteProps,
) {
  return renderInstructorCourseEditorRoute(props, "collaborators");
}
