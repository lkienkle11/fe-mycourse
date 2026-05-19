import type { StreamInboundEventOf, StreamOutboundEventOf } from "../common";

export type BroadcastLogoutPayload = {
  /** Lý do logout (tuỳ backend / tab gửi). */
  reason?: string;
};

export type BroadcastConfirmSuccessPayload = {
  messageId: string;
};

type BroadcastEventMap = {
  logout: BroadcastLogoutPayload;
  confirm_success: BroadcastConfirmSuccessPayload;
};

/** Event nhận được qua BroadcastChannel (tab khác). */
export type BroadcastStreamEvent = StreamInboundEventOf<
  "broadcast",
  BroadcastEventMap
>;

/** Gói gửi qua broadcast (không có `code` trong metadata). */
export type BroadcastOutboundEvent = StreamOutboundEventOf<
  "broadcast",
  BroadcastEventMap
>;
