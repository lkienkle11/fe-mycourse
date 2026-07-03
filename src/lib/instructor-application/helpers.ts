import type {
  InstructorApplication,
  InstructorApplicationProfile,
  InstructorProfilePayload,
} from "@/types/instructor";

export function resolveInstructorApplicationProfile(
  application: Pick<
    InstructorApplication,
    "latest_submission" | "profile"
  > | null,
): InstructorApplicationProfile | InstructorProfilePayload | null {
  if (!application) return null;
  return application.latest_submission?.profile ?? application.profile ?? null;
}

export function resolveInstructorDisplayName(
  application:
    | Pick<InstructorApplication, "display_name" | "full_name">
    | Partial<Pick<InstructorApplication, "display_name" | "full_name">>
    | null,
): string {
  if (!application) return "";
  return (
    application.display_name?.trim() || application.full_name?.trim() || ""
  );
}
