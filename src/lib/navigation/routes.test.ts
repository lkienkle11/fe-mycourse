import { describe, expect, it } from "@jest/globals";
import {
  courseDetailHref,
  defaultPostAuthHref,
  homeHref,
  loginHref,
  resolvePostAuthHref,
  signedInHomeHref,
  signupHref,
} from "./routes";

describe("loginHref / signupHref", () => {
  it("builds a plain destination with no next param", () => {
    expect(loginHref()).toBe("/login");
    expect(signupHref()).toBe("/signup");
  });

  it("builds a destination with an encoded next param", () => {
    expect(loginHref("/instructor/courses")).toBe(
      "/login?next=%2Finstructor%2Fcourses",
    );
    expect(signupHref("/admin/courses/all?page=2")).toBe(
      "/signup?next=%2Fadmin%2Fcourses%2Fall%3Fpage%3D2",
    );
  });

  it("omits the next param when given null", () => {
    expect(loginHref(null)).toBe("/login");
  });
});

describe("courseDetailHref", () => {
  it("builds the public course path from the slug", () => {
    expect(courseDetailHref("intro-to-go")).toBe("/courses/intro-to-go");
  });

  it("encodes characters that are not path safe", () => {
    expect(courseDetailHref("a b/c")).toBe("/courses/a%20b%2Fc");
  });
});

describe("defaultPostAuthHref", () => {
  it("is the signed-in home", () => {
    expect(defaultPostAuthHref).toBe("/home");
    expect(defaultPostAuthHref).toBe(signedInHomeHref);
  });
});

describe("resolvePostAuthHref", () => {
  it("falls back to the signed-in home without a return path", () => {
    expect(resolvePostAuthHref(null)).toBe(defaultPostAuthHref);
  });

  it("treats the public homepage as no return path", () => {
    expect(resolvePostAuthHref(homeHref)).toBe(defaultPostAuthHref);
  });

  it("keeps any other safe return path", () => {
    expect(resolvePostAuthHref("/instructor")).toBe("/instructor");
  });
});
