import { create } from "zustand";

import { STREAM_EVENTS_LOG_MAX } from "@/constants/events";
import type { StreamEvent } from "@/types/events";

type StreamEventsState = {
  /** Seq tăng dần phía client khi cần gán cho metadata gửi đi / thiếu seq lúc nhận. */
  clientSeq: number;
  /** Event mới nhất (tiện debug). */
  last: StreamEvent | null;
  /** Lịch sử ngắn (vòng). */
  log: StreamEvent[];
  nextClientSeq: () => number;
  push: (event: StreamEvent) => void;
};

export const useStreamEventsStore = create<StreamEventsState>((set, get) => ({
  clientSeq: 0,
  last: null,
  log: [],

  nextClientSeq: () => {
    const next = get().clientSeq + 1;
    set({ clientSeq: next });
    return next;
  },

  push: (event) =>
    set((s) => ({
      last: event,
      log: [...s.log.slice(-(STREAM_EVENTS_LOG_MAX - 1)), event],
    })),
}));
