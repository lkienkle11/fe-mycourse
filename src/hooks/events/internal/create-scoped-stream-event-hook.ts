"use client";

import type { StreamEvent, StreamEventSource } from "@/types/events";
import {
  type StreamEventSubscribeInput,
  useStreamEvent,
} from "../use-stream-event";

export function scopeStreamEventInput<E extends StreamEvent>(
  source: StreamEventSource,
  input: StreamEventSubscribeInput<E>,
): StreamEventSubscribeInput<E> {
  if (typeof input === "function") {
    return (event) => {
      if (event.source === source) {
        input(event);
      }
    };
  }

  if (Array.isArray(input)) {
    return input.map(({ order, handler }) => ({
      order,
      handler: (event) => {
        if (event.source === source) {
          handler(event);
        }
      },
    }));
  }

  return {
    order: input.order,
    handler: (event) => {
      if (event.source === source) {
        input.handler(event);
      }
    },
  };
}

export function createScopedStreamEventHook<
  S extends StreamEventSource,
  E extends Extract<StreamEvent, { source: S }>,
>(source: S) {
  return function useScopedStreamEvent(
    type: E["type"] | undefined,
    input: StreamEventSubscribeInput<E>,
  ): void {
    useStreamEvent(
      type ? { source, type } : { source },
      scopeStreamEventInput(source, input),
    );
  };
}
