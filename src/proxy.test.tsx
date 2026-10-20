import { describe, expect, it } from "@jest/globals";
import { NextRequest } from "next/server";
import proxy, { config } from "./proxy";

const SESSION = "refresh_token=r; session_id=s";

function request(path: string, cookie?: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : {},
  });
}

describe("proxy: signed-in redirect from a locale root", () => {
  it.each([
    ["/en", "/en/home"],
    ["/vi", "/vi/home"],
    ["/vi/", "/vi/home"],
  ])("redirects %s with a session to %s", (path, target) => {
    const response = proxy(request(path, SESSION));

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe(
      target,
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("vary")).toBe("Cookie");
  });

  it("keeps the locale cookie chosen by the locale negotiation", () => {
    const response = proxy(request("/en", SESSION));

    expect(response.headers.getSetCookie().join(";")).toContain(
      "NEXT_LOCALE=en",
    );
  });

  it("serves the public page to a guest without redirecting", () => {
    const response = proxy(request("/en"));

    expect(response.status).not.toBe(307);
    expect(response.headers.get("location")).toBeNull();
  });

  it.each([
    "refresh_token=r",
    "session_id=s",
    "access_token=a",
  ])("does not redirect with only %s", (cookie) => {
    const response = proxy(request("/vi", cookie));

    expect(response.headers.get("location")).toBeNull();
  });

  it.each([
    "/en/home",
    "/en/login",
    "/en/courses/some-slug",
  ])("leaves %s untouched even with a session", (path) => {
    const response = proxy(request(path, SESSION));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("vary") ?? "").not.toContain("Cookie");
  });

  it("sends the bare root to a locale root first", () => {
    const response = proxy(request("/", SESSION));

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toMatch(
      /^\/(en|vi)$/,
    );
  });
});

describe("proxy: guest redirect from the signed-in home", () => {
  it.each([
    ["/en/home", "/en"],
    ["/vi/home", "/vi"],
    ["/vi/home/", "/vi"],
  ])("redirects %s without a session to %s", (path, target) => {
    const response = proxy(request(path));

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe(
      target,
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("vary")).toBe("Cookie");
  });

  it.each([
    "refresh_token=r",
    "session_id=s",
  ])("still redirects with only %s", (cookie) => {
    const response = proxy(request("/vi/home", cookie));

    expect(response.status).toBe(307);
  });

  it("serves the signed-in home to a visitor with a session", () => {
    const response = proxy(request("/vi/home", SESSION));

    expect(response.headers.get("location")).toBeNull();
  });
});

describe("proxy matcher", () => {
  it("still skips api, internals, OAuth callbacks and files with an extension", () => {
    expect(config.matcher).toEqual([
      "/((?!api|trpc|_next|_vercel|auth/discord/callback|auth/x/callback|.*\\..*).*)",
    ]);
  });
});
