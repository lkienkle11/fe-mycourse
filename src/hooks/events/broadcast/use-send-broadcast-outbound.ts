"use client";

import { useCallback } from "react";

import {
  type BroadcastOutboundSendInput,
  sendBroadcastOutbound,
} from "@/events/broadcast/send-broadcast-outbound";

/**
 * Gửi event sang tab khác: bọc `sendBroadcastOutbound` trong callback ổn định cho React.
 */
export function useSendBroadcastOutbound() {
  return useCallback(
    (message: BroadcastOutboundSendInput) => sendBroadcastOutbound(message),
    [],
  );
}
