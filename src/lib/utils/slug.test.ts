import { describe, expect, it } from "@jest/globals";
import {
  generateSlug,
  SLUG_MAX_LENGTH,
  SLUG_PATTERN,
  sanitizeSlugInput,
} from "./slug";

describe("sanitizeSlugInput", () => {
  it("keeps lowercase letters, digits and dashes untouched", () => {
    expect(sanitizeSlugInput("abc---123")).toBe("abc---123");
  });

  it("drops uppercase and accented characters", () => {
    expect(sanitizeSlugInput("Khóa Học 01!")).toBe("ha-c-01");
  });

  it("drops emoji, CJK and punctuation", () => {
    expect(sanitizeSlugInput("go😀日本_lang.")).toBe("golang");
  });

  it("turns every whitespace character into a dash", () => {
    expect(sanitizeSlugInput("go course")).toBe("go-course");
    expect(sanitizeSlugInput("a  b\tc")).toBe("a--b-c");
    expect(sanitizeSlugInput(" edge ")).toBe("-edge-");
  });

  it("is idempotent", () => {
    const once = sanitizeSlugInput("Some Mixed Ünput 42");
    expect(sanitizeSlugInput(once)).toBe(once);
  });

  it("caps the length at SLUG_MAX_LENGTH", () => {
    expect(SLUG_MAX_LENGTH).toBe(255);
    expect(sanitizeSlugInput("a".repeat(300))).toHaveLength(SLUG_MAX_LENGTH);
  });
});

describe("SLUG_PATTERN", () => {
  it.each([
    ["a", true],
    ["abc---123", true],
    ["golang-course-x7k92ab", true],
    ["-abc", false],
    ["abc-", false],
    ["Abc", false],
    ["", false],
    ["a_b", false],
  ])("%j → %s", (value, expected) => {
    expect(SLUG_PATTERN.test(value)).toBe(expected);
  });
});

describe("generateSlug (taxonomy preview, unchanged)", () => {
  it("still strips accents and normalizes spaces", () => {
    expect(generateSlug("36 Thanh Hóa")).toBe("36-thanh-hoa");
  });
});
