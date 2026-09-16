/**
 * Node 22+ ships an unconfigured built-in `globalThis.localStorage`. MSW's
 * Node `CookieStore` checks `typeof localStorage` (not `isNodeProcess()`)
 * and breaks against it, so it must be removed before MSW's module loads.
 * Runs via `setupFiles` (before `setupFilesAfterEnv`, where MSW starts).
 */
Reflect.deleteProperty(globalThis, "localStorage");
