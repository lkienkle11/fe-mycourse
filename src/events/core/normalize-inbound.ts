import { z } from "zod";

import { makeStreamEventCode } from "@/events/core/event-code";
import type {
  StreamEvent,
  StreamEventSource,
  StreamInboundMetadata,
} from "@/types/events";

const inboundSchema = z.object({
  /** Tab khác có thể gửi thiếu `source` — dùng `defaultSource` lúc normalize. */
  source: z.enum(["broadcast", "sse", "websocket", "gRPC"]).optional(),
  type: z.string().min(1),
  payload: z.unknown(),
  metadata: z
    .object({
      timestamp: z.number().optional(),
      seq: z.number().optional(),
      code: z.string().optional(),
    })
    .optional(),
});

const helloPayload = z.object({
  message: z.string(),
  from: z.string().optional(),
});

const notificationPayload = z.object({
  title: z.string(),
  body: z.string().optional(),
});

const broadcastLogoutPayload = z.object({
  reason: z.string().optional(),
});

const broadcastConfirmPayload = z.object({
  messageId: z.string().min(1),
});

const pingPayload = z.object({
  id: z.string().optional(),
});

const pongPayload = z.object({
  id: z.string().optional(),
});

const streamChannelInboundSchemas = {
  notification: notificationPayload,
  hello: helloPayload,
} as const;

/** Schema payload theo từng `(source, type)` được phép ingest. */
const inboundPayloadBySource: Record<
  StreamEventSource,
  Record<string, z.ZodType>
> = {
  broadcast: {
    logout: broadcastLogoutPayload,
    confirm_success: broadcastConfirmPayload,
  },
  sse: {
    ...streamChannelInboundSchemas,
    pong: pongPayload,
  },
  websocket: {
    ...streamChannelInboundSchemas,
    ping: pingPayload,
    pong: pongPayload,
  },
  gRPC: {
    ...streamChannelInboundSchemas,
  },
};

function buildTypedStreamEvent(
  source: StreamEventSource,
  type: string,
  payload: unknown,
  metadata: StreamInboundMetadata,
): StreamEvent | null {
  const schema = inboundPayloadBySource[source][type];
  if (!schema) {
    return null;
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return null;
  }
  return {
    source,
    type,
    payload: parsed.data,
    metadata,
  } as StreamEvent;
}

export type NormalizeInboundOptions = {
  /** Khi message thiếu `source` (ví dụ chỉ gửi qua BroadcastChannel). */
  defaultSource?: StreamEventSource;
  /** Cấp seq mới nếu payload không có `metadata.seq`. */
  nextSeq: () => number;
};

function buildMetadata(
  source: StreamEventSource,
  type: string,
  partial: z.infer<typeof inboundSchema>["metadata"],
  nextSeq: () => number,
): StreamInboundMetadata {
  const timestamp = partial?.timestamp ?? Date.now();
  const seq = partial?.seq ?? nextSeq();
  const code = partial?.code ?? makeStreamEventCode(source, type);
  return { timestamp, seq, code };
}

/**
 * Parse JSON thành `StreamEvent` đã type-safe.
 * Trả `null` nếu shape không khớp schema đã khai báo.
 */
export function normalizeInboundEnvelope(
  raw: unknown,
  options: NormalizeInboundOptions,
): StreamEvent | null {
  const parsed = inboundSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }

  const v = parsed.data;
  const source: StreamEventSource | undefined =
    v.source ?? options.defaultSource;
  if (!source) {
    return null;
  }

  const meta = buildMetadata(source, v.type, v.metadata, options.nextSeq);
  return buildTypedStreamEvent(source, v.type, v.payload, meta);
}
