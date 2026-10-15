import { describe, expect, it } from "@jest/globals";
import {
  getTaxonomyFormSchema,
  taxonomyOutcomeSchema,
  taxonomySkillSchema,
  taxonomySlugStatusSchema,
  taxonomyTopicSchema,
} from "./taxonomy";

describe("taxonomySlugStatusSchema", () => {
  it.each([
    ["valid name/status", { name: "Level One", status: "ACTIVE" }, true],
    ["blank name", { name: "   ", status: "ACTIVE" }, false],
    ["missing name", { status: "ACTIVE" }, false],
    ["name over 255 chars", { name: "a".repeat(256), status: "ACTIVE" }, false],
    ["invalid status enum", { name: "Level One", status: "PUBLISHED" }, false],
  ])("%s", (_label, input, expectedValid) => {
    expect(taxonomySlugStatusSchema.safeParse(input).success).toBe(
      expectedValid,
    );
  });

  it("trims the name before validating length/emptiness", () => {
    const result = taxonomySlugStatusSchema.safeParse({
      name: "  Padded  ",
      status: "ACTIVE",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Padded");
    }
  });
});

describe("taxonomyTopicSchema", () => {
  it("accepts the base slug/status fields plus an optional image_file_id", () => {
    expect(
      taxonomyTopicSchema.safeParse({
        name: "Programming",
        status: "ACTIVE",
        image_file_id: "file-1",
      }).success,
    ).toBe(true);
  });

  it("still requires a valid name (inherited from the base schema)", () => {
    expect(
      taxonomyTopicSchema.safeParse({ name: "", status: "ACTIVE" }).success,
    ).toBe(false);
  });
});

describe("taxonomySkillSchema", () => {
  it("accepts the base slug/status fields without children", () => {
    expect(
      taxonomySkillSchema.safeParse({ name: "Go", status: "INACTIVE" }).success,
    ).toBe(true);
  });
});

describe("taxonomyOutcomeSchema", () => {
  it.each([
    [
      "valid short description, no description lines",
      { short_description: "Learn the basics", status: "ACTIVE" },
      true,
    ],
    [
      "blank short description",
      { short_description: "", status: "ACTIVE" },
      false,
    ],
    [
      "short description over 100 chars",
      { short_description: "a".repeat(101), status: "ACTIVE" },
      false,
    ],
    [
      "9 description lines (over the 8-line max)",
      {
        short_description: "Outcome",
        status: "ACTIVE",
        description: Array.from({ length: 9 }, (_, i) => `line ${i}`),
      },
      false,
    ],
    [
      "a description line over 120 chars",
      {
        short_description: "Outcome",
        status: "ACTIVE",
        description: ["a".repeat(121)],
      },
      false,
    ],
    [
      "8 description lines (at the max) is valid",
      {
        short_description: "Outcome",
        status: "ACTIVE",
        description: Array.from({ length: 8 }, (_, i) => `line ${i}`),
      },
      true,
    ],
  ])("%s", (_label, input, expectedValid) => {
    expect(taxonomyOutcomeSchema.safeParse(input).success).toBe(expectedValid);
  });
});

function firstMessage(result: {
  success: boolean;
  error?: { issues: { message: string }[] };
}) {
  return result.error?.issues[0]?.message;
}

describe("taxonomy slug field", () => {
  const base = { name: "Level One", status: "ACTIVE" };

  it.each([
    ["omitted", undefined, true],
    ["blank", "", true],
    ["valid", "beginner-level", true],
    ["consecutive dashes", "abc---123", true],
    ["single character", "a", true],
    ["leading dash", "-abc", false],
    ["trailing dash", "abc-", false],
    ["uppercase", "ABC", false],
    ["underscore", "abc_123", false],
    ["non-ascii", "日本語", false],
  ])("create schema: %s", (_label, slug, expectedValid) => {
    const input = slug === undefined ? base : { ...base, slug };
    expect(taxonomySlugStatusSchema.safeParse(input).success).toBe(
      expectedValid,
    );
  });

  it("reports slugMax for a 256-character slug", () => {
    const result = taxonomySlugStatusSchema.safeParse({
      ...base,
      slug: "a".repeat(256),
    });
    expect(result.success).toBe(false);
    expect(firstMessage(result)).toBe("validation.slugMax");
  });

  it("is inherited by the topic and skill schemas", () => {
    expect(
      taxonomyTopicSchema.safeParse({ ...base, slug: "-bad" }).success,
    ).toBe(false);
    expect(
      taxonomySkillSchema.safeParse({ ...base, slug: "good-slug" }).success,
    ).toBe(true);
  });

  it("does not add a slug to the outcome schema", () => {
    expect(
      taxonomyOutcomeSchema.safeParse({
        short_description: "Outcome",
        status: "ACTIVE",
        slug: "-bad",
      }).success,
    ).toBe(true);
  });
});

describe("getTaxonomyFormSchema", () => {
  const base = { name: "Level One", status: "ACTIVE" };

  it("allows a blank or missing slug in create mode", () => {
    const schema = getTaxonomyFormSchema("levels", "create");
    expect(schema.safeParse({ ...base, slug: "" }).success).toBe(true);
    expect(schema.safeParse(base).success).toBe(true);
  });

  it.each([
    "levels",
    "tags",
    "topics",
    "skills",
  ] as const)("requires a non-blank slug in edit mode for %s", (resourceKey) => {
    const schema = getTaxonomyFormSchema(resourceKey, "edit");
    const blank = schema.safeParse({ ...base, slug: "" });
    expect(blank.success).toBe(false);
    expect(firstMessage(blank)).toBe("validation.slugRequired");
    expect(schema.safeParse({ ...base, slug: "ok-slug" }).success).toBe(true);
  });

  it("keeps the outcome schema unchanged in both modes", () => {
    const create = getTaxonomyFormSchema("outcomes", "create");
    const edit = getTaxonomyFormSchema("outcomes", "edit");
    const valid = { short_description: "Outcome", status: "ACTIVE" };
    expect(create.safeParse(valid).success).toBe(true);
    expect(edit.safeParse(valid).success).toBe(true);
  });
});
