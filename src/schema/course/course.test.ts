import { describe, expect, it } from "@jest/globals";
import { courseBasicInfoSchema, courseCreateSchema } from "./course";

const validBasicInfo = {
  title: "Golang course",
  slug: "golang-course",
  short_description: "A short description that is long enough to pass.",
  about_course: JSON.stringify({
    ops: [{ insert: `${"x".repeat(40)}\n` }],
  }),
  thumbnail_file_id: "0198c2f0-0000-7000-8000-000000000001",
  thumbnail_url: "",
  preview_video_file_id: "",
  preview_video_url: "",
  course_level_id: "0198c2f0-0000-7000-8000-000000000002",
  course_topic_id: "0198c2f0-0000-7000-8000-000000000003",
  tag_ids: ["0198c2f0-0000-7000-8000-000000000004"],
  skill_ids: ["0198c2f0-0000-7000-8000-000000000005"],
  outcome_ids: ["0198c2f0-0000-7000-8000-000000000006"],
  expected_row_version: 1,
};

function firstMessage(result: {
  success: boolean;
  error?: { issues: { message: string }[] };
}) {
  return result.error?.issues[0]?.message;
}

describe("courseCreateSchema slug", () => {
  it("accepts a blank slug", () => {
    expect(
      courseCreateSchema.safeParse({ title: "Golang course", slug: "" })
        .success,
    ).toBe(true);
  });

  it("accepts a valid slug", () => {
    expect(
      courseCreateSchema.safeParse({
        title: "Golang course",
        slug: "abc---123",
      }).success,
    ).toBe(true);
  });

  it("rejects a slug that starts or ends with a dash", () => {
    const result = courseCreateSchema.safeParse({
      title: "Golang course",
      slug: "-abc",
    });
    expect(result.success).toBe(false);
    expect(firstMessage(result)).toBe("validation.slugInvalid");
  });

  it("rejects a slug over 255 characters", () => {
    const result = courseCreateSchema.safeParse({
      title: "Golang course",
      slug: "a".repeat(256),
    });
    expect(result.success).toBe(false);
    expect(firstMessage(result)).toBe("validation.slugMax");
  });
});

describe("courseBasicInfoSchema slug", () => {
  it("accepts a complete form with a valid slug", () => {
    expect(courseBasicInfoSchema.safeParse(validBasicInfo).success).toBe(true);
  });

  it("reports slugRequired first for an empty slug", () => {
    const result = courseBasicInfoSchema.safeParse({
      ...validBasicInfo,
      slug: "",
    });
    expect(result.success).toBe(false);
    expect(firstMessage(result)).toBe("validation.slugRequired");
  });

  it("rejects an invalid slug", () => {
    const result = courseBasicInfoSchema.safeParse({
      ...validBasicInfo,
      slug: "abc-",
    });
    expect(result.success).toBe(false);
    expect(firstMessage(result)).toBe("validation.slugInvalid");
  });
});
