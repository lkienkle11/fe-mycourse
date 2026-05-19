"use client";

import { useEffect, useRef } from "react";

import {
  type StreamEventFilter,
  subscribeStreamEvents,
} from "@/events/core/subscribe";
import type { StreamEvent } from "@/types/events";

export type { StreamEventFilter };

export type StreamEventListenerRegistration<
  E extends StreamEvent = StreamEvent,
> = {
  /** Nhỏ chạy trước. Mặc định `0`. */
  order?: number;
  handler: (event: E) => void;
};

/** Một handler, hoặc nhiều handler có `order` cho cùng bộ lọc. */
export type StreamEventSubscribeInput<E extends StreamEvent = StreamEvent> =
  | ((event: E) => void)
  | StreamEventListenerRegistration<E>
  | StreamEventListenerRegistration<E>[];

function normalizeRegistrations<E extends StreamEvent>(
  input: StreamEventSubscribeInput<E>,
): StreamEventListenerRegistration<E>[] {
  if (typeof input === "function") {
    return [{ order: 0, handler: input }];
  }
  if (Array.isArray(input)) {
    return input;
  }
  return [input];
}

/**
 * Lắng nghe event realtime đã chuẩn hoá.
 * - Một `handler` hoặc mảng `{ order, handler }[]` cho cùng `filter`.
 * - Nhiều component cùng key: mỗi hook gọi `useStreamEvent` với `order` khác nhau.
 */
export function useStreamEvent<E extends StreamEvent = StreamEvent>(
  filter: StreamEventFilter | undefined,
  input: StreamEventSubscribeInput<E>,
): void {
  const registrationsRef = useRef<StreamEventListenerRegistration<E>[]>([]);

  useEffect(() => {
    registrationsRef.current = normalizeRegistrations(input);
  }, [input]);

  useEffect(() => {
    const registrations = normalizeRegistrations(input);

    const unsubs = registrations.map((reg, index) =>
      subscribeStreamEvents({
        filter,
        order: reg.order ?? 0,
        handler: (event) => {
          registrationsRef.current[index]?.handler(event as E);
        },
      }),
    );

    return () => {
      for (const unsub of unsubs) {
        unsub();
      }
    };
  }, [filter, input]);
}
