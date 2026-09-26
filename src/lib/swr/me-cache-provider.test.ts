import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { getMeEndpointKey } from "@/api/callers/auth";
import type {
  isMeCacheFresh as IsMeCacheFresh,
  meCacheProvider as MeCacheProvider,
} from "./me-cache-provider";

const STORAGE_KEY = "swr-me-cache";
if (!getMeEndpointKey) throw new Error("getMeEndpointKey resolved to null");
const meKey = getMeEndpointKey;

function persist(state: unknown, persistedAt: number = Date.now()): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ state, persistedAt }));
}

describe("meCacheProvider / isMeCacheFresh", () => {
  let meCacheProvider: typeof MeCacheProvider;
  let isMeCacheFresh: typeof IsMeCacheFresh;

  beforeEach(async () => {
    // Both keep/read a module-level singleton cache (see `meCacheProvider`'s
    // doc comment) so it survives real SWRConfig remounts without leaking a
    // `beforeunload` listener per remount. Each test needs a fresh module
    // instance to observe first-call behavior in isolation.
    jest.resetModules();
    ({ meCacheProvider, isMeCacheFresh } = await import("./me-cache-provider"));
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("returns an empty cache when sessionStorage has nothing persisted", () => {
    const cache = meCacheProvider();
    expect(cache.get(meKey)).toBeUndefined();
  });

  it("restores a previously persisted /me entry", () => {
    const state = { data: { email: "user@example.com" }, isLoading: false };
    persist(state);

    const cache = meCacheProvider();

    expect(cache.get(meKey)).toEqual(state);
  });

  it("restores a persisted `data: null` entry (a confirmed logged-out state)", () => {
    persist({ data: null, isLoading: false });

    const cache = meCacheProvider();

    expect(cache.get(meKey)).toEqual({ data: null, isLoading: false });
  });

  it("ignores a persisted entry that carries an error", () => {
    persist({ error: "boom", isLoading: false });

    const cache = meCacheProvider();

    expect(cache.get(meKey)).toBeUndefined();
  });

  it("ignores corrupt JSON instead of throwing", () => {
    sessionStorage.setItem(STORAGE_KEY, "{not json");

    expect(() => meCacheProvider()).not.toThrow();
  });

  it("persists the current /me entry to sessionStorage on beforeunload, and clears it once removed", () => {
    const cache = meCacheProvider();
    const state = { data: { email: "user@example.com" }, isLoading: false };
    cache.set(meKey, state);

    window.dispatchEvent(new Event("beforeunload"));
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    expect(stored.state).toEqual(state);
    expect(typeof stored.persistedAt).toBe("number");

    cache.delete(meKey);
    window.dispatchEvent(new Event("beforeunload"));
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("returns the same cache instance on repeated calls instead of registering another listener each time", () => {
    const addSpy = jest.spyOn(window, "addEventListener");

    const first = meCacheProvider();
    const second = meCacheProvider();
    const third = meCacheProvider();

    expect(second).toBe(first);
    expect(third).toBe(first);
    expect(
      addSpy.mock.calls.filter(([type]) => type === "beforeunload"),
    ).toHaveLength(1);

    addSpy.mockRestore();
  });

  it("isMeCacheFresh is false when nothing is persisted", () => {
    expect(isMeCacheFresh(30_000)).toBe(false);
  });

  it("isMeCacheFresh is true within the given max age", () => {
    persist({ data: { email: "user@example.com" }, isLoading: false });
    expect(isMeCacheFresh(30_000)).toBe(true);
  });

  it("isMeCacheFresh is false once older than the given max age", () => {
    persist(
      { data: { email: "user@example.com" }, isLoading: false },
      Date.now() - 31_000,
    );
    expect(isMeCacheFresh(30_000)).toBe(false);
  });

  it("isMeCacheFresh is false for a persisted entry that carries an error", () => {
    persist({ error: "boom", isLoading: false });
    expect(isMeCacheFresh(30_000)).toBe(false);
  });
});
