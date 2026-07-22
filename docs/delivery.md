# Delivery Surfaces (`fe-mycourse`)

_Last audited: 2026-05-29 (stubs unchanged; not affected by constants refactor)._


Index of **non-REST** realtime channels exposed to the browser. REST/Axios usage remains in [`api-using.md`](./api-using.md) and [`api-overview.md`](./api-overview.md).

---

## Summary

| Channel | Status | Client transport | Config / env | Detail doc |
|---------|--------|------------------|--------------|------------|
| **BroadcastChannel** | Implemented | Same-origin tab sync | Always on (`config/events/broadcast`) | [`delivery/broadcast.md`](./delivery/broadcast.md) |
| **WebSocket** | Implemented | `reconnecting-websocket` | `NEXT_PUBLIC_STREAM_WS_URL` | [`delivery/websocket.md`](./delivery/websocket.md) |
| **SSE** | Implemented | `@microsoft/fetch-event-source` | `NEXT_PUBLIC_STREAM_SSE_URL` | [`delivery/sse.md`](./delivery/sse.md) |
| **gRPC (NDJSON gateway)** | Implemented (interim) | `fetch` + NDJSON reader | `NEXT_PUBLIC_STREAM_GRPC_BASE_URL` | [`delivery/grpc.md`](./delivery/grpc.md) |
| **GraphQL subscriptions** | Not implemented | — | — | [`delivery/graphql.md`](./delivery/graphql.md) |
| **MQTT** | Not implemented | — | — | [`delivery/mqtt.md`](./delivery/mqtt.md) |
| **Long polling** | Not implemented | — | — | [`delivery/long-polling.md`](./delivery/long-polling.md) |

---

## Shared envelope model

Every inbound message is normalized to a **`StreamEvent`** with four fields:

| Field | Inbound | Outbound |
|-------|---------|----------|
| `source` | `broadcast` \| `sse` \| `websocket` \| `gRPC` | Same |
| `type` | Channel-specific string | Same |
| `payload` | Validated per `(source, type)` | Same |
| `metadata` | `timestamp`, `seq`, **`code`** (`source:type`) | `timestamp`, `seq` only (no `code`) |

**Core pipeline (all channels):**

```
Transport (raw JSON)
  → publishRawStreamPayload()          [src/events/core/publish.ts]
  → normalizeInboundEnvelope()         [src/events/core/normalize-inbound.ts]
  → useStreamEventsStore.push()        [src/store/events/stream-events-store.ts]
  → emitStreamEventToSubscribers()     [src/events/core/subscribe.ts]
  → useStreamEvent / use*StreamEvent hooks (nhiều handler / `order` — xem [`patterns.md`](./patterns.md) §4.1)
```

**Bootstrap:** `EventsStreamProvider` in `AppProviders` calls `startStreamEventTransports()` on mount — see [`src/components/providers/app-providers.tsx`](../src/components/providers/app-providers.tsx).

---

## Environment variables (build-time)

Set **before** `npm run build` (Next.js inlines `NEXT_PUBLIC_*`):

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_STREAM_SSE_URL` | No | Full SSE endpoint URL; empty → SSE transport skipped |
| `NEXT_PUBLIC_STREAM_WS_URL` | No | WebSocket URL (`wss://…`); empty → WS skipped |
| `NEXT_PUBLIC_STREAM_GRPC_BASE_URL` | No | Base URL for NDJSON stream (no trailing slash); empty → gRPC path skipped |

Constants: [`src/constants/events/index.ts`](../src/constants/events/index.ts) (`STREAM_ENV_KEYS`).

BroadcastChannel does **not** use env — enabled via `broadcastEventsConfig.enabled`.

---

## Type definitions

| Asset | Path |
|-------|------|
| Union of all inbound events | `src/types/events/stream-events.ts` → `StreamEvent` |
| Union of all outbound events | `src/types/events/stream-events.ts` → `StreamOutboundEvent` |
| Generic inbound/outbound builders | `src/types/events/common.ts` → `StreamInboundEventOf`, `StreamOutboundEventOf` |
| Shared payloads + channel maps | `src/types/events/payloads.ts` |
| Per-channel aliases | `src/types/events/{broadcast,sse,socket,gRPC}/index.ts` |

Full reusable-asset entries: [`reusable-assets.md`](./reusable-assets.md#stream-events-realtime).

---

## Security (cross-cutting)

| Concern | Behavior |
|---------|----------|
| **Validation** | Zod in `normalize-inbound.ts`; unknown `(source, type)` or bad payload → event dropped (`null`), not pushed to store |
| **Auth** | gRPC NDJSON uses `credentials: "include"` (cookies). WS/SSE URLs must be issued by backend with same auth model as REST |
| **Reject** | Non-JSON WS/SSE lines ignored; malformed envelope never reaches subscribers |
| **Broadcast** | Same-origin only (browser `BroadcastChannel`); no cross-domain |

Per-channel details: see each file under `docs/delivery/`.

---

## Related documentation

- [`folder-structure.md`](./folder-structure.md) — `src/events/`, `src/config/events/`, hooks, stores
- [`flow.md`](./flow.md) — § Stream events lifecycle
- [`logic-flow.md`](./logic-flow.md) — § Stream events ingest
- [`deploy.md`](./deploy.md) — env vars for stream URLs
- [`dependencies.md`](./dependencies.md) — `reconnecting-websocket`, `@microsoft/fetch-event-source`
