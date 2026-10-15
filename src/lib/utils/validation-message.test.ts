import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { toast } from "sonner";
import type { ZodIssue } from "zod";
import {
  firstValidationMessageKey,
  resolveValidationMessage,
  toastValidationError,
  translateValidationIssueMessage,
} from "./validation-message";

describe("resolveValidationMessage", () => {
  const translate = (key: string) => `t:${key}`;

  it("returns an empty string when there is no message", () => {
    expect(resolveValidationMessage(translate, undefined)).toBe("");
    expect(resolveValidationMessage(translate, "")).toBe("");
  });

  it("translates the stored key through the scoped translator", () => {
    expect(resolveValidationMessage(translate, "validation.name")).toBe(
      "t:validation.name",
    );
  });

  it("accepts a translator typed with a narrower key union", () => {
    const typed = (key: "validation.a" | "validation.b") => `typed:${key}`;
    expect(resolveValidationMessage(typed, "validation.a")).toBe(
      "typed:validation.a",
    );
  });
});

describe("firstValidationMessageKey", () => {
  const issue = (message: string) => ({ message }) as ZodIssue;

  it("strips the `validation.` prefix of the first issue", () => {
    expect(firstValidationMessageKey([issue("validation.titleMax")], "x")).toBe(
      "titleMax",
    );
  });

  it("falls back when there is no prefixed message", () => {
    expect(firstValidationMessageKey([], "fallback")).toBe("fallback");
    expect(firstValidationMessageKey([issue("plain")], "fallback")).toBe(
      "fallback",
    );
  });
});

describe("translateValidationIssueMessage", () => {
  it("maps a stored key through a leaf translator", () => {
    const leaf = (key: string) => `leaf:${key}`;
    expect(
      translateValidationIssueMessage(leaf, "validation.slugMax", "title"),
    ).toBe("leaf:slugMax");
    expect(translateValidationIssueMessage(leaf, undefined, "title")).toBe(
      "leaf:title",
    );
  });
});

describe("toastValidationError", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("toasts the translated leaf key of the first issue", () => {
    const spy = jest.spyOn(toast, "error").mockImplementation(() => "id");
    const leaf = (key: string) => `leaf:${key}`;
    toastValidationError(
      leaf,
      [{ message: "validation.titleMin" } as ZodIssue],
      "title",
    );
    expect(spy).toHaveBeenCalledWith("leaf:titleMin");
  });

  it("toasts the fallback key when the issue has no validation prefix", () => {
    const spy = jest.spyOn(toast, "error").mockImplementation(() => "id");
    const leaf = (key: string) => `leaf:${key}`;
    toastValidationError(leaf, [], "title");
    expect(spy).toHaveBeenCalledWith("leaf:title");
  });
});
