import { describe, expect, it } from "@jest/globals";
import { isSafeInternalPath } from "./safe-redirect";

describe("isSafeInternalPath", () => {
  it("accepts a plain internal path", () => {
    expect(isSafeInternalPath("/instructor/courses")).toBe(true);
  });

  it("accepts an internal path with a query string", () => {
    expect(isSafeInternalPath("/admin/courses/all?page=2")).toBe(true);
  });

  it("rejects an absolute URL", () => {
    expect(isSafeInternalPath("https://evil.example.com")).toBe(false);
  });

  it("rejects a protocol-relative path", () => {
    expect(isSafeInternalPath("//evil.example.com")).toBe(false);
  });

  it("rejects a backslash-prefixed path", () => {
    expect(isSafeInternalPath("/\\evil.example.com")).toBe(false);
    expect(isSafeInternalPath("\\evil.example.com")).toBe(false);
  });

  it("rejects a tab/newline/CR that would let a URL parser turn this into a protocol-relative path", () => {
    // Browsers (and Next.js's router) strip ASCII tab/newline/CR before
    // parsing a URL, so "/\t/evil.com" would otherwise pass the "//" check
    // below and resolve to the protocol-relative "//evil.com".
    expect(isSafeInternalPath("/\t/evil.example.com")).toBe(false);
    expect(isSafeInternalPath("/\n/evil.example.com")).toBe(false);
    expect(isSafeInternalPath("/\r/evil.example.com")).toBe(false);
  });

  it("rejects a path not starting with a slash", () => {
    expect(isSafeInternalPath("instructor/courses")).toBe(false);
  });

  it("rejects null, undefined, and empty values", () => {
    expect(isSafeInternalPath(null)).toBe(false);
    expect(isSafeInternalPath(undefined)).toBe(false);
    expect(isSafeInternalPath("")).toBe(false);
  });
});
