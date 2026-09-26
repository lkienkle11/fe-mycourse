import { describe, expect, it } from "@jest/globals";
import { loginHref, signupHref } from "./routes";

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
