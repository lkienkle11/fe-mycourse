import { describe, expect, it } from "@jest/globals";
import { renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en";
import {
  buildMockAppRouter,
  MockAppRouterProvider,
} from "@/test-support/mock-app-router";
import { useAuthNextParam } from "./use-auth-next-param";

/**
 * `useSearchParams` reads a context this codebase's `MockAppRouterProvider`
 * doesn't set up (it only covers `useRouter`'s `AppRouterContext`), so it
 * renders as `null` under jsdom regardless of the real URL — the hook
 * already treats that the same as "no `next` param" (see
 * `use-auth-next-param.ts`). This pins down that fallback behavior and that
 * it never calls `router.replace` when there is nothing to strip. Full
 * "reads a real `?next=...` from the URL" coverage lives at the integration
 * level (the `/login` and `/signup` route tests).
 */
describe("useAuthNextParam", () => {
  it("returns null when the URL carries no `next` param, and never navigates", () => {
    const router = buildMockAppRouter();
    const { result } = renderHook(() => useAuthNextParam(), {
      wrapper: ({ children }) => (
        <NextIntlClientProvider locale="en" messages={messages}>
          <MockAppRouterProvider router={router}>
            {children}
          </MockAppRouterProvider>
        </NextIntlClientProvider>
      ),
    });

    expect(result.current.nextPath).toBeNull();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
