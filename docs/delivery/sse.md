# SSE (Server-Sent Events) Delivery

_Last audited: 2026-05-29 (stub unchanged)._

---

## Introduction

**One-way** server → client stream over HTTP. Implemented with **`@microsoft/fetch-event-source`** (supports headers, abort, reconnect). Client **cannot** send events on the SSE connection itself.

---

## Implementation details

| Item | Location |
|------|----------|
| Env | `NEXT_PUBLIC_STREAM_SSE_URL` → `src/config/events/sse/index.ts` |
| Transport | `src/events/sse/sse-transport.ts` |
| Listen hook | `src/hooks/events/sse/use-sse-stream-event.ts` |
| Store | `src/store/events/sse/index.ts` |

`onmessage`: expects `ev.data` to be JSON envelope. Non-JSON lines (SSE comments, native ping comments) are ignored.

Reconnect: `onerror` returns `4000` (ms) per library contract.

---

## Client-to-server flow

**Not supported on the SSE socket.** Outbound types (`SseOutboundEvent`) exist for API symmetry and possible future HTTP publish helpers; they are **not** sent by `sse-transport.ts`.

If the product needs client → server heartbeat, use REST or WebSocket instead.

---

## Server-to-client flow

```
GET NEXT_PUBLIC_STREAM_SSE_URL
  → fetchEventSource (AbortController on unmount)
  → each event: data: {json envelope}\n\n
  → JSON.parse(ev.data)
  → publishRawStreamPayload(raw, "sse")
  → normalize → store + subscribers
```

---

## Data types returned to the client

**Inbound (`SseStreamEvent`):** `SseInboundEventMap` in `src/types/events/payloads.ts`

| `type` | Payload | Notes |
|--------|---------|--------|
| `notification` | `StreamNotificationPayload` | Demo / product notifications |
| `hello` | `StreamHelloPayload` | Demo handshake |
| `pong` | `StreamPongPayload` — `{ id? }` | **Server → client only** (heartbeat response) |

There is **no** inbound `ping` type on SSE (client cannot send on this channel).

**Outbound type (`SseOutboundEvent`):** only `notification` and `hello` — no `ping` / `pong`.

Alias file: `src/types/events/sse/index.ts`.

Zod: `sse` entry in `inboundPayloadBySource` (`normalize-inbound.ts`).

---

## Security model

| Control | Detail |
|---------|--------|
| Input validation | Zod per allowed `type`; unknown type → `null` |
| Auth | Configure URL/cookies on server; FE uses default fetch credentials per `fetch-event-source` options (extend transport if Bearer headers needed) |
| Reject | Empty `data`, invalid JSON, failed validation → skip |

---

## Summary

SSE is **server-push only**. Use **`pong`** (and optional `id`) for server-driven keepalive; use WebSocket for bidirectional ping/pong.
