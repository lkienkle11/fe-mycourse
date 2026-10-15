import { describe, expect, it } from "@jest/globals";
import { changedNonBlank, omitWhenBlank, payloadField } from "./payload";

describe("omitWhenBlank", () => {
  it.each([
    ["undefined", undefined],
    ["null", null],
    ["empty string", ""],
    ["whitespace only", "   "],
  ])("omits %s", (_label, value) => {
    expect(omitWhenBlank(value)).toBeUndefined();
  });

  it("returns a non-blank value unchanged (no trimming)", () => {
    expect(omitWhenBlank(" id-1 ")).toBe(" id-1 ");
    expect(omitWhenBlank("id-1")).toBe("id-1");
  });
});

describe("changedNonBlank", () => {
  it("omits blank and whitespace-only values", () => {
    expect(changedNonBlank("")).toBeUndefined();
    expect(changedNonBlank("   ", "old")).toBeUndefined();
  });

  it("omits a value equal to the persisted one (after trimming)", () => {
    expect(changedNonBlank("same", "same")).toBeUndefined();
    expect(changedNonBlank("  same  ", "same")).toBeUndefined();
  });

  it("returns the trimmed value when it differs from the persisted one", () => {
    expect(changedNonBlank("  next ", "old")).toBe("next");
  });

  it("uses create semantics when persisted is omitted", () => {
    expect(changedNonBlank(" fresh ")).toBe("fresh");
  });
});

describe("payloadField", () => {
  it("spreads a defined value under the given key", () => {
    expect({ title: "t", ...payloadField("slug", "abc") }).toEqual({
      title: "t",
      slug: "abc",
    });
  });

  it("leaves the key absent when the value is undefined", () => {
    const payload = { title: "t", ...payloadField("slug", undefined) };
    expect("slug" in payload).toBe(false);
  });
});
