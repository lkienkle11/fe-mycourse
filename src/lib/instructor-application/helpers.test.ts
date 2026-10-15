import { describe, expect, it } from "@jest/globals";
import type { InstructorApplication } from "@/types/instructor";
import { mergeInstructorApplicationDetail } from "./helpers";

function buildApplication(
  overrides: Partial<InstructorApplication> = {},
): InstructorApplication {
  return {
    id: "app-1",
    user_id: "user-1",
    full_name: "Applicant",
    avatar: "",
    slug: "applicant",
    review_status: "pending",
    ...overrides,
  };
}

describe("mergeInstructorApplicationDetail", () => {
  it("returns the list row when there is no detail", () => {
    const row = buildApplication();
    expect(mergeInstructorApplicationDetail(row, null)).toBe(row);
  });

  it("returns the detail when there is no list row", () => {
    const detail = buildApplication({ slug: "from-detail" });
    expect(mergeInstructorApplicationDetail(null, detail)).toBe(detail);
  });

  it("keeps the slug returned by the detail when merged with a list row", () => {
    const merged = mergeInstructorApplicationDetail(
      buildApplication({ slug: "from-list" }),
      buildApplication({ slug: "from-detail" }),
    );
    expect(merged?.slug).toBe("from-detail");
  });
});
