import { describe, expect, it } from "@jest/globals";
import { SLUG_MAX_LENGTH } from "@/lib/utils/slug";
import { updateMeSchema } from "./me";

const AVATAR_FILE_ID = "0190a5f0-7c3e-7b1a-9d2e-3f4a5b6c7d8e";

function firstMessage(value: unknown) {
  const result = updateMeSchema.safeParse(value);
  return result.success ? null : result.error.issues[0]?.message;
}

describe("updateMeSchema", () => {
  it("accepts an empty body (avatar and slug are both optional)", () => {
    expect(updateMeSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a valid avatar UUID and a blank avatar", () => {
    expect(
      updateMeSchema.safeParse({ avatar_file_id: AVATAR_FILE_ID }).success,
    ).toBe(true);
    expect(updateMeSchema.safeParse({ avatar_file_id: "" }).success).toBe(true);
  });

  it("rejects a non-UUID avatar with validation.avatarFileId", () => {
    expect(firstMessage({ avatar_file_id: "not-a-uuid" })).toBe(
      "validation.avatarFileId",
    );
  });

  it.each(["go", "my-name-2", "a1"])("accepts slug %j", (slug) => {
    expect(updateMeSchema.safeParse({ slug }).success).toBe(true);
  });

  it("treats a blank slug as 'do not send' and accepts it", () => {
    expect(updateMeSchema.safeParse({ slug: "" }).success).toBe(true);
  });

  it.each([
    "-go",
    "go-",
    "Go",
    "go_lang",
    "go lang",
  ])("rejects slug %j with validation.slugInvalid", (slug) => {
    expect(firstMessage({ slug })).toBe("validation.slugInvalid");
  });

  it("rejects an over-length slug with validation.slugMax", () => {
    expect(firstMessage({ slug: "a".repeat(SLUG_MAX_LENGTH + 1) })).toBe(
      "validation.slugMax",
    );
  });
});
