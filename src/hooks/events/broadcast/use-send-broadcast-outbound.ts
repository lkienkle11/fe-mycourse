"use client";

import { useCallback } from "react";

import { postBroadcastOutbound } from "@/events/broadcast/broadcast-transport";
import { nextStreamOutboundMetadata } from "@/events/core/outbound-metadata";
import type {
  BroadcastOutboundEvent,
  StreamOutboundMetadata,
} from "@/types/events";

/** Gửi broadcast: `metadata` có thể bỏ — hook sẽ gắn seq + timestamp. */
export type BroadcastOutboundSendInput =
  | (Omit<Extract<BroadcastOutboundEvent, { type: "logout" }>, "metadata"> & {
      metadata?: StreamOutboundMetadata;
    })
  | (Omit<
      Extract<BroadcastOutboundEvent, { type: "confirm_success" }>,
      "metadata"
    > & { metadata?: StreamOutboundMetadata });

/**
 * Gửi event sang tab khác.
 * Truyền đủ `source` + `type` + `payload` đúng cặp; `metadata` có thể bỏ để tự sinh seq + timestamp.
 */
export function useSendBroadcastOutbound() {
  return useCallback((message: BroadcastOutboundSendInput) => {
    const meta = message.metadata ?? nextStreamOutboundMetadata();
    if (message.type === "logout") {
      postBroadcastOutbound({
        source: "broadcast",
        type: "logout",
        payload: message.payload,
        metadata: meta,
      });
      return;
    }
    postBroadcastOutbound({
      source: "broadcast",
      type: "confirm_success",
      payload: message.payload,
      metadata: meta,
    });
  }, []);
}
