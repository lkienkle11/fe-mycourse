import { type RenderOptions, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import { SWRConfig } from "swr";
import messages from "@/messages/en";

type ProvidersProps = {
  children: ReactNode;
};

function Providers({ children }: ProvidersProps) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {/* A fresh cache Map per render isolates SWR state between tests —
          the global SWR cache is otherwise a singleton that would leak
          fetched data and in-flight requests across test cases. */}
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        {children}
      </SWRConfig>
    </NextIntlClientProvider>
  );
}

/** Real `next-intl` messages + an isolated per-test SWR cache, plus a ready `userEvent` session. */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Providers, ...options }),
  };
}
