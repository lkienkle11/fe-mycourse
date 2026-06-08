"use client";

import type { SseStreamEvent } from "@/types/events";
import { createScopedStreamEventHook } from "../internal/create-scoped-stream-event-hook";

type SseType = SseStreamEvent["type"];
export const useSseStreamEvent: (
  type: SseType | undefined,
  input: Parameters<
    ReturnType<typeof createScopedStreamEventHook<"sse", SseStreamEvent>>
  >[1],
) => void = createScopedStreamEventHook<"sse", SseStreamEvent>("sse");
