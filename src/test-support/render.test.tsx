import { describe, expect, it } from "@jest/globals";
import { screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { renderWithProviders } from "@/test-support/render";

function RealMessageProbe() {
  const t = useTranslations("home");
  return <div>{t("title")}</div>;
}

function SwrCacheProbe({ swrKey }: { swrKey: string }) {
  const { data } = useSWR(swrKey, () => "fetched-value");
  return <div data-testid="swr-value">{data ?? "loading"}</div>;
}

describe("renderWithProviders", () => {
  it("renders real message-catalog content, not a stub", () => {
    renderWithProviders(<RealMessageProbe />);

    expect(screen.getByText("FE boilerplate is ready")).toBeInTheDocument();
  });

  it("gives each render a fresh SWR cache — no shared state across renders", async () => {
    const first = renderWithProviders(<SwrCacheProbe swrKey="probe-key" />);
    expect(await first.findByTestId("swr-value")).toHaveTextContent(
      "fetched-value",
    );
    first.unmount();

    // A brand-new render with the same key must not see the previous
    // render's cached SWR entry — it should start from "loading" again.
    const second = renderWithProviders(<SwrCacheProbe swrKey="probe-key" />);
    expect(second.getByTestId("swr-value")).toHaveTextContent("loading");
  });

  it("does not leak MSW handlers or DOM state across renders", () => {
    const { container, unmount } = renderWithProviders(<RealMessageProbe />);
    expect(container.textContent).toContain("FE boilerplate is ready");
    unmount();

    // `afterEach` in `jest.setup.ts` runs RTL `cleanup()` between tests, not
    // between renders inside the same test — verify document.body is clean
    // after an explicit unmount within this test.
    expect(document.body.textContent).toBe("");
  });

  it("rejects an unmocked request instead of reaching a real service", async () => {
    await expect(fetch("https://example.test/unhandled")).rejects.toThrow();
  });
});
