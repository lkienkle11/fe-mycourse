import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import type { CarouselApi } from "@/components/ui/carousel";
import { useCarouselAutoplay } from "./use-carousel-autoplay";

const INTERVAL = 3000;

function createFakeApi() {
  const handlers = new Map<string, Set<() => void>>();
  const emit = (event: string) => {
    for (const handler of handlers.get(event) ?? []) handler();
  };
  const scrollNext = jest.fn(() => emit("select"));
  const api = {
    on: (event: string, handler: () => void) => {
      handlers.set(event, (handlers.get(event) ?? new Set()).add(handler));
    },
    off: (event: string, handler: () => void) => {
      handlers.get(event)?.delete(handler);
    },
    scrollNext,
  } as unknown as NonNullable<CarouselApi>;
  return { api, emit, scrollNext };
}

describe("useCarouselAutoplay", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("scrolls next every interval", () => {
    const { api, scrollNext } = createFakeApi();
    renderHook(() => useCarouselAutoplay(api, INTERVAL));
    act(() => {
      jest.advanceTimersByTime(INTERVAL * 3);
    });
    expect(scrollNext).toHaveBeenCalledTimes(3);
  });

  it("restarts the countdown when the slide changes manually", () => {
    const { api, emit, scrollNext } = createFakeApi();
    renderHook(() => useCarouselAutoplay(api, INTERVAL));
    act(() => {
      jest.advanceTimersByTime(INTERVAL - 500);
      emit("select");
      jest.advanceTimersByTime(INTERVAL - 1);
    });
    expect(scrollNext).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(scrollNext).toHaveBeenCalledTimes(1);
  });

  it("pauses while the pointer is down and re-arms when the drag settles", () => {
    const { api, emit, scrollNext } = createFakeApi();
    renderHook(() => useCarouselAutoplay(api, INTERVAL));
    act(() => {
      emit("pointerDown");
      jest.advanceTimersByTime(INTERVAL * 3);
    });
    expect(scrollNext).not.toHaveBeenCalled();
    act(() => {
      emit("settle");
      jest.advanceTimersByTime(INTERVAL);
    });
    expect(scrollNext).toHaveBeenCalledTimes(1);
  });

  it("stays idle when the user prefers reduced motion", () => {
    const matchMedia = jest
      .spyOn(window, "matchMedia")
      .mockReturnValue({ matches: true } as MediaQueryList);
    const { api, scrollNext } = createFakeApi();
    renderHook(() => useCarouselAutoplay(api, INTERVAL));
    act(() => {
      jest.advanceTimersByTime(INTERVAL * 3);
    });
    expect(scrollNext).not.toHaveBeenCalled();
    matchMedia.mockRestore();
  });

  it("stops the timer on unmount", () => {
    const { api, scrollNext } = createFakeApi();
    const { unmount } = renderHook(() => useCarouselAutoplay(api, INTERVAL));
    unmount();
    act(() => {
      jest.advanceTimersByTime(INTERVAL * 2);
    });
    expect(scrollNext).not.toHaveBeenCalled();
  });
});
