import { useMeStore } from "@/store/auth";
import type { MeResponse } from "@/types/auth";

/** Synthetic `MeResponse` factory — never real user data/tokens. */
export function buildMeResponse(
  overrides: Partial<MeResponse> = {},
): MeResponse {
  return {
    user_id: "user-1",
    user_code: "U-0001",
    email: "learner@example.com",
    display_name: "Test Learner",
    slug: "test-learner",
    email_confirmed: true,
    is_disabled: false,
    created_at: 1_700_000_000,
    permissions: [],
    roles: [],
    ...overrides,
  };
}

/** Puts a signed-in user (and its permissions) into the Zustand me store, as `useSyncMeFromAuth` would. */
export function seedSignedInMe(
  permissions: string[] = [],
  overrides: Partial<MeResponse> = {},
): MeResponse {
  const me = buildMeResponse({ permissions, ...overrides });
  useMeStore.setState({
    me,
    isLoading: false,
    isError: undefined,
    mePermissions: permissions,
  });
  return me;
}
