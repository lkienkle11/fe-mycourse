import { describe, expect, it } from "@jest/globals";
import type {
  CourseBasicInfoForm,
  CourseDetail,
  CourseVersion,
} from "@/types/course";
import {
  createCourseBasicInfoState,
  toCreateCoursePayload,
  toUpdateCourseBasicInfoPayload,
  validateCourseSubmitReadiness,
} from "./course";

const draftVersion: CourseVersion = {
  id: "version-1",
  course_id: "course-1",
  version_no: 1,
  status: "DRAFT",
  title: "Golang course",
  short_description: "A short description that is long enough to pass.",
  about_course: JSON.stringify({ ops: [{ insert: `${"x".repeat(40)}\n` }] }),
  thumbnail_file_id: "0198c2f0-0000-7000-8000-000000000001",
  course_level_id: "0198c2f0-0000-7000-8000-000000000002",
  course_topic_id: "0198c2f0-0000-7000-8000-000000000003",
  tag_ids: ["0198c2f0-0000-7000-8000-000000000004"],
  skill_ids: ["0198c2f0-0000-7000-8000-000000000005"],
  outcome_ids: ["0198c2f0-0000-7000-8000-000000000006"],
  row_version: 3,
  rejection_reason: "",
  created_at: 1,
  updated_at: 1,
};

function buildDetail(slug: string): CourseDetail {
  return {
    course: {
      id: "course-1",
      owner_user_id: "user-1",
      slug,
      created_at: 1,
      updated_at: 1,
    },
    collaborator_role: "OWNER",
    draft_version: draftVersion,
    collaborators: [],
    outline: [],
  };
}

describe("createCourseBasicInfoState", () => {
  it("seeds the form slug from the course slug", () => {
    expect(createCourseBasicInfoState(draftVersion, "golang-course").slug).toBe(
      "golang-course",
    );
  });

  it("defaults to an empty slug", () => {
    expect(createCourseBasicInfoState(draftVersion).slug).toBe("");
  });
});

describe("toUpdateCourseBasicInfoPayload", () => {
  const form: CourseBasicInfoForm = createCourseBasicInfoState(
    draftVersion,
    "golang-course",
  );

  it("omits the slug when it equals the persisted slug", () => {
    const payload = toUpdateCourseBasicInfoPayload(form, "golang-course");
    expect(payload).not.toHaveProperty("slug");
    expect(payload.title).toBe("Golang course");
  });

  it("includes the slug when it changed", () => {
    const payload = toUpdateCourseBasicInfoPayload(
      { ...form, slug: "golang-v2" },
      "golang-course",
    );
    expect(payload.slug).toBe("golang-v2");
  });
});

describe("toCreateCoursePayload", () => {
  it("omits a blank slug and trims the title", () => {
    expect(toCreateCoursePayload("  Golang course ", "")).toEqual({
      title: "Golang course",
    });
    expect(toCreateCoursePayload("Golang course", "   ")).toEqual({
      title: "Golang course",
    });
  });

  it("includes a filled slug", () => {
    expect(toCreateCoursePayload("Golang course", "golang-course")).toEqual({
      title: "Golang course",
      slug: "golang-course",
    });
  });
});

describe("validateCourseSubmitReadiness slug", () => {
  it("passes basic info when the course has a valid slug", () => {
    const issues = validateCourseSubmitReadiness(buildDetail("golang-course"));
    expect(issues?.[0]?.message).toBe("submitCollaboratorRequired");
  });

  it("reports incomplete basic info when the course slug is invalid", () => {
    const issues = validateCourseSubmitReadiness(buildDetail(""));
    expect(issues?.[0]?.message).toBe("submitBasicInfoIncomplete");
  });
});
