import { InstructorCourseEditorPage } from "@/screen/instructor/courses/editor-page";

export default async function InstructorCourseEditorRoute({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return <InstructorCourseEditorPage courseId={Number(courseId)} />;
}
