import { describe, expect, it } from "@jest/globals";
import { SLUG_MAX_LENGTH } from "@/lib/utils/slug";
import { optionalSlugField, requiredSlugField } from "./slug";

function firstMessage(
  schema: typeof optionalSlugField | typeof requiredSlugField,
  value: string,
) {
  const result = schema.safeParse(value);
  return result.success ? null : result.error.issues[0]?.message;
}

describe("optionalSlugField", () => {
  it.each(["", "go", "go-lang-2", "a1"])("accepts %j", (value) => {
    expect(optionalSlugField.safeParse(value).success).toBe(true);
  });

  it.each([
    "-go",
    "go-",
    "Go",
    "go_lang",
    "go lang",
  ])("rejects %j as invalid", (value) => {
    expect(firstMessage(optionalSlugField, value)).toBe(
      "validation.slugInvalid",
    );
  });

  it("rejects an over-length value with validation.slugMax", () => {
    const tooLong = "a".repeat(SLUG_MAX_LENGTH + 1);
    expect(firstMessage(optionalSlugField, tooLong)).toBe("validation.slugMax");
  });
});

describe("requiredSlugField", () => {
  it("reports validation.slugRequired first for a blank value", () => {
    expect(firstMessage(requiredSlugField, "")).toBe("validation.slugRequired");
  });

  it("accepts a valid slug", () => {
    expect(requiredSlugField.safeParse("go-lang").success).toBe(true);
  });

  it("rejects an invalid format", () => {
    expect(firstMessage(requiredSlugField, "Go Lang")).toBe(
      "validation.slugInvalid",
    );
  });

  it("rejects an over-length value", () => {
    const tooLong = "a".repeat(SLUG_MAX_LENGTH + 1);
    expect(firstMessage(requiredSlugField, tooLong)).toBe("validation.slugMax");
  });
});
