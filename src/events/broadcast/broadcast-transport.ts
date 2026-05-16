import { broadcastEventsConfig } from "@/config/events/broadcast";
import { publishRawStreamPayload } from "@/events/core/publish";
import type { BroadcastOutboundEvent } from "@/types/events";

let channel: BroadcastChannel | null = null;

function ensureBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (!broadcastEventsConfig.enabled) {
    return null;
  }
  if (!channel) {
    channel = new BroadcastChannel(broadcastEventsConfig.channelName);
    channel.onmessage = (ev) => {
      let raw: unknown = ev.data;
      if (typeof raw === "string") {
        try {
          raw = JSON.parse(raw) as unknown;
        } catch {
          return;
        }
      }
      publishRawStreamPayload(raw, "broadcast");
    };
  }
  return channel;
}

/** Mở BroadcastChannel và nhận message từ tab khác. */
export function startBroadcastTransport(): () => void {
  ensureBroadcastChannel();
  return () => {
    channel?.close();
    channel = null;
  };
}

/** Gửi event sang mọi tab cùng origin (JSON string trên BroadcastChannel). */
export function postBroadcastOutbound(message: BroadcastOutboundEvent): void {
  const ch = ensureBroadcastChannel();
  ch?.postMessage(JSON.stringify(message));
}
