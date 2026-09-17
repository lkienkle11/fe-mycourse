import { describe, expect, it } from "@jest/globals";
import {
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
