import { InstructorCourseEditorPage } from "@/screen/instructor/courses/editor-page";
import type { CourseEditorTab } from "@/types/course";

export type InstructorCourseEditorRouteProps = {
  params: Promise<{ courseId: string }>;
};

export async function renderInstructorCourseEditorRoute(
  { params }: InstructorCourseEditorRouteProps,
  tab: CourseEditorTab,
) {
  const { courseId } = await params;
  return <InstructorCourseEditorPage courseId={Number(courseId)} tab={tab} />;
}
