import { describe, expect, it } from "@jest/globals";
import { useMeStore } from "@/store/auth";
import { seedSignedInMe } from "@/test-support/fixtures/auth";
import {
  buildMockAppRouter,
  MockAppRouterProvider,
} from "@/test-support/mock-app-router";
import { renderWithProviders } from "@/test-support/render";
import { useRedirectIfAuthenticated } from "./use-redirect-if-authenticated";

function Harness({ nextPath }: { nextPath: string | null }) {
  const redirecting = useRedirectIfAuthenticated(nextPath);
  return <p>{redirecting ? "redirecting" : "stay"}</p>;
}

function renderHarness(nextPath: string | null) {
  const router = buildMockAppRouter();
  renderWithProviders(
    <MockAppRouterProvider router={router}>
      <Harness nextPath={nextPath} />
    </MockAppRouterProvider>,
  );
  return router;
}

describe("useRedirectIfAuthenticated", () => {
  it("sends an already signed-in visitor to the signed-in home by default", () => {
    seedSignedInMe();
    const router = renderHarness(null);

    expect(router.replace).toHaveBeenCalledWith(
      expect.stringMatching(/\/home$/),
    );
  });

  it("sends an already signed-in visitor to a validated next path instead", () => {
    seedSignedInMe();
    const router = renderHarness("/instructor");

    expect(router.replace).toHaveBeenCalledWith(
      expect.stringMatching(/\/instructor$/),
    );
  });

  it("does nothing for a guest", () => {
    useMeStore.setState({ me: null, isLoading: false });
    const router = renderHarness(null);

    expect(router.replace).not.toHaveBeenCalled();
  });
});
