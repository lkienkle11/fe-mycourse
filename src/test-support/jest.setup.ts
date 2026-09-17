import "@testing-library/jest-dom/jest-globals";
import { afterAll, afterEach, beforeAll, jest } from "@jest/globals";
import { cleanup } from "@testing-library/react";
import { server } from "@/test-support/msw/server";
import { resetStores } from "@/test-support/reset-stores";

// Fail loudly on any request MSW doesn't have a handler for, instead of
// letting it silently hit (or fail to hit) a real network endpoint.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  resetStores();
  cleanup();
});

afterAll(() => server.close());

// jsdom implements none of these; Radix UI primitives probe them
// unconditionally on mount regardless of whether the test exercises them.
if (typeof window !== "undefined") {
  if (!window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  if (!window.matchMedia) {
    window.matchMedia = jest.fn<(query: string) => MediaQueryList>(
      (query) =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        }) as MediaQueryList,
    );
  }

  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
}
