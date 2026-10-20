import { describe, expect, it } from "@jest/globals";
import {
  getLocaleRootLocale,
  hasAuthSessionCookies,
  resolveGuestHomeRedirectPath,
  resolveSignedInHomeRedirectPath,
} from "./signed-in-home-redirect";

function cookies(...names: string[]) {
  const set = new Set(names);
  return { has: (name: string) => set.has(name) };
}

describe("hasAuthSessionCookies", () => {
  it("requires both refresh_token and session_id", () => {
    expect(hasAuthSessionCookies(cookies("refresh_token", "session_id"))).toBe(
      true,
    );
    expect(hasAuthSessionCookies(cookies("refresh_token"))).toBe(false);
    expect(hasAuthSessionCookies(cookies("session_id"))).toBe(false);
    expect(hasAuthSessionCookies(cookies("access_token"))).toBe(false);
  });
});

describe("resolveSignedInHomeRedirectPath", () => {
  it.each([
    ["/vi", "/vi/home"],
    ["/vi/", "/vi/home"],
    ["/en", "/en/home"],
    ["/en/", "/en/home"],
    ["/", null],
    ["//", null],
    ["/fr", null],
    ["/vi/home", null],
    ["/vi/login", null],
    ["/vi/courses/some-slug", null],
    ["/vi//", null],
    ["", null],
  ])("with a session %j -> %j", (pathname, expected) => {
    expect(
      resolveSignedInHomeRedirectPath({ pathname, hasSession: true }),
    ).toBe(expected);
  });

  it.each([
    "/vi",
    "/en/",
    "/",
    "/vi/home",
  ])("never redirects %j without a session", (pathname) => {
    expect(
      resolveSignedInHomeRedirectPath({ pathname, hasSession: false }),
    ).toBeNull();
  });
});

describe("resolveGuestHomeRedirectPath", () => {
  it.each([
    ["/vi/home", "/vi"],
    ["/vi/home/", "/vi"],
    ["/en/home", "/en"],
    ["/home", null],
    ["/fr/home", null],
    ["/vi", null],
    ["/vi/homepage", null],
    ["/vi/home/extra", null],
    ["/vi/courses/home", null],
    ["", null],
  ])("without a session %j -> %j", (pathname, expected) => {
    expect(resolveGuestHomeRedirectPath({ pathname, hasSession: false })).toBe(
      expected,
    );
  });

  it.each([
    "/vi/home",
    "/en/home/",
  ])("never redirects %j with a session", (pathname) => {
    expect(
      resolveGuestHomeRedirectPath({ pathname, hasSession: true }),
    ).toBeNull();
  });
});

describe("locale root detection", () => {
  it("returns the locale for locale roots only", () => {
    expect(getLocaleRootLocale("/en")).toBe("en");
    expect(getLocaleRootLocale("/vi/")).toBe("vi");
    expect(getLocaleRootLocale("/vi/home")).toBeNull();
    expect(getLocaleRootLocale("/")).toBeNull();
  });
});
