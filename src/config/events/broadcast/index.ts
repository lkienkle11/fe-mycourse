/** Tên kênh BroadcastChannel — mặc định cố định để mọi tab cùng app khớp nhau. */
export const broadcastEventsConfig = {
  /** `true` luôn bật transport broadcast (không cần URL). */
  enabled: true as const,
  channelName: "mycourse:stream-events",
} as const;

export type BroadcastEventsConfig = typeof broadcastEventsConfig;
