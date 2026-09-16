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
    avatar_url: "",
    email_confirmed: true,
    is_disabled: false,
    created_at: 1_700_000_000,
    permissions: [],
    roles: [],
    ...overrides,
  };
}
