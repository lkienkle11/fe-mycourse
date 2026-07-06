import { Suspense } from "react";
import { InstructorRosterPage } from "@/screen/common/instructor";

export default function AdminInstructorRosterPage() {
  return (
    <Suspense fallback={null}>
      <InstructorRosterPage />
    </Suspense>
  );
}
