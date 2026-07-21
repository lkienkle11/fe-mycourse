/**
 * Endpoint-bound public cache registry and validator (server policy leaf).
 * Empty registry is a valid Phase 6 PASS (PublicCacheProfileId = never).
 */

export type PublicValuePolicy =
  | { kind: "enum"; values: readonly string[]; allowRepeated: boolean }
  | {
      kind: "bounded-public";
      maxLength: number;
      pattern: RegExp;
      allowRepeated: boolean;
    };

export type PublicCacheProfileDefinition = {
  enabled: boolean;
  allowedOrigin: string;
  allowedPathnames: readonly string[];
  allowedQuery: Readonly<Record<string, PublicValuePolicy>>;
  allowedRequestHeaders: Readonly<Record<string, PublicValuePolicy>>;
  cache: "force-cache";
  revalidate: number | false;
  tags: readonly string[];
  owner: string;
  freshnessContract: string;
};

/**
 * Empty until a reviewed endpoint is approved.
 */
export const publicCacheProfiles = {
  // Empty registry — no production profiles yet.
} as const satisfies Record<string, PublicCacheProfileDefinition>;

export type PublicCacheProfileId = keyof typeof publicCacheProfiles;

export type ResolvedPublicCacheOptions = {
  cache: "force-cache";
  next: {
    revalidate: number | false;
    tags: string[];
  };
};

/**
 * Resolve a profile to fixed Next fetch cache options.
 * With an empty registry this always rejects.
 */
export function resolvePublicCacheProfile(
  cacheProfileId: PublicCacheProfileId,
): {
  profile: PublicCacheProfileDefinition;
  fetchOptions: ResolvedPublicCacheOptions;
} {
  void cacheProfileId;
  throw Object.assign(new Error("cache-profile-unknown"), {
    code: "cache-profile-unknown" as const,
  });
}

export function validatePublicCacheRequest(input: {
  cacheProfileId: PublicCacheProfileId;
  method: string;
  url: string;
  headers?: Record<string, string>;
}): ResolvedPublicCacheOptions {
  if (input.method.toUpperCase() !== "GET") {
    throw Object.assign(new Error("cache-profile-mismatch"), {
      code: "cache-profile-mismatch" as const,
    });
  }

  void input.cacheProfileId;
  void input.url;
  void input.headers;
  throw Object.assign(new Error("cache-profile-unknown"), {
    code: "cache-profile-unknown" as const,
  });
}
