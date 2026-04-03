/**
 * Global API error store (Zustand).
 *
 * Populated automatically by the Axios response interceptor in
 * src/api/instance.ts whenever a request fails and the caller did NOT
 * wrap the call in a try-catch.  Callers who do catch can still read or
 * clear entries here if they want to sync with the global state.
 *
 * Usage in any client component:
 *
 *   const { lastError, errors, clear } = useApiError();
 *
 * The store keeps at most MAX_ERRORS entries to prevent unbounded growth.
 */

import { create } from "zustand";

/** Maximum number of error entries retained in memory at a time. */
const MAX_ERRORS = 20;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiErrorEntry {
  /** Unique identifier (crypto.randomUUID). */
  id: string;
  /** HTTP status code (0 when there is no response, e.g. network error). */
  statusCode: number;
  /**
   * Application-level error code from the BE response body
   * (mirrors be/pkg/errcode/codes.go). Falls back to 9999 (Unknown) when
   * the response body does not include a `code` field.
   */
  appCode: number;
  /** Human-readable error message from the BE response body or Axios. */
  message: string;
  /** Request URL (relative path, e.g. "/auth/login"). */
  url: string;
  /** HTTP method in uppercase (GET | POST | PUT | DELETE | …). */
  method: string;
  /** Unix timestamp (ms) when the error was recorded. */
  timestamp: number;
}

interface ApiErrorState {
  /** All retained errors, oldest-first. */
  errors: ApiErrorEntry[];
  /** The most recently added error, or `null` when the store is empty. */
  lastError: ApiErrorEntry | null;
  /** Add a new error entry (id and timestamp are generated automatically). */
  push: (error: Omit<ApiErrorEntry, "id" | "timestamp">) => void;
  /** Remove a single error by its id. */
  remove: (id: string) => void;
  /** Clear all errors and reset lastError to null. */
  clear: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useApiError = create<ApiErrorState>((set) => ({
  errors: [],
  lastError: null,

  push: (error) => {
    const entry: ApiErrorEntry = {
      ...error,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    set((state) => {
      const next = [...state.errors, entry];
      return {
        errors: next.length > MAX_ERRORS ? next.slice(-MAX_ERRORS) : next,
        lastError: entry,
      };
    });
  },

  remove: (id) =>
    set((state) => ({
      errors: state.errors.filter((e) => e.id !== id),
    })),

  clear: () => set({ errors: [], lastError: null }),
}));
