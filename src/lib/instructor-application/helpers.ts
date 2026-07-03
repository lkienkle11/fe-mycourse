import type {
  InstructorApplication,
  InstructorApplicationProfile,
  InstructorProfilePayload,
  InstructorTaxonomyChip,
  MyInstructorApplication,
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

export function mergeInstructorApplicationDetail(
  listRow: InstructorApplication | null,
  detail: InstructorApplication | null | undefined,
): InstructorApplication | null {
  if (!detail) return listRow;
  if (!listRow) return detail;
  const displayName =
    detail.display_name?.trim() ||
    listRow.display_name?.trim() ||
    detail.full_name?.trim() ||
    listRow.full_name?.trim() ||
    "";
  const fullName =
    detail.full_name?.trim() ||
    listRow.full_name?.trim() ||
    detail.display_name?.trim() ||
    listRow.display_name?.trim() ||
    "";
  return {
    ...listRow,
    ...detail,
    display_name: displayName,
    full_name: fullName,
    email: detail.email?.trim() || listRow.email?.trim() || "",
    avatar: detail.avatar?.trim() || listRow.avatar?.trim() || "",
  };
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

export function taxonomyChipLabelMap(
  chips: InstructorTaxonomyChip[] | undefined,
): Record<string, string> {
  if (!chips?.length) return {};
  return Object.fromEntries(chips.map((chip) => [chip.id, chip.name]));
}

export function resolveApplicationTaxonomyLabels(
  application: MyInstructorApplication | null | undefined,
): {
  topics: Record<string, string>;
  skills: Record<string, string>;
} {
  return {
    topics: taxonomyChipLabelMap(application?.topics),
    skills: taxonomyChipLabelMap(application?.skills),
  };
}
