"use client";

import { useEffect } from "react";
import type { CarouselApi } from "@/components/ui/carousel";

/**
 * Auto-advances an embla carousel to the right every `intervalMs`.
 *
 * The timer is re-armed on every slide change (a manual swipe, a dot click or a key
 * press all change the slide) and after a drag that settles on the same slide, so any
 * manual interaction restarts the countdown. It is paused while the pointer is down and
 * not started at all when the user prefers reduced motion.
 */
export function useCarouselAutoplay(api: CarouselApi, intervalMs: number) {
  useEffect(() => {
    if (!api) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)
      return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const clear = () => clearTimeout(timer);
    const arm = () => {
      clear();
      timer = setTimeout(() => api.scrollNext(), intervalMs);
    };

    arm();
    api.on("select", arm);
    api.on("settle", arm);
    api.on("pointerDown", clear);
    return () => {
      clear();
      api.off("select", arm);
      api.off("settle", arm);
      api.off("pointerDown", clear);
    };
  }, [api, intervalMs]);
}
