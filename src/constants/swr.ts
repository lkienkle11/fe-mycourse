/** Shared SWR defaults for `AppProviders` (`SWRConfig`). */
export const SWR_DEDUPING_INTERVAL_MS = 30 * 1000;

/** SWR default is 5 s; use 3 min to avoid hammering BE on repeated fetch errors. */
export const SWR_ERROR_RETRY_INTERVAL_MS = 3 * 60 * 1000;

export const DEFAULT_SWR_CONFIG = {
  revalidateOnFocus: false,
  dedupingInterval: SWR_DEDUPING_INTERVAL_MS,
  errorRetryInterval: SWR_ERROR_RETRY_INTERVAL_MS,
} as const;
