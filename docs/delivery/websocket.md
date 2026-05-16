# WebSocket Delivery

_Last audited: 2026-05-19._

---

## Introduction

Full-duplex JSON text channel for server push and client send. Uses **`reconnecting-websocket`** for auto-reconnect. Each message is one JSON **envelope** (see [`delivery.md`](../delivery.md)).

---

## Implementation details

| Item | Location |
|------|----------|
| Env | `NEXT_PUBLIC_STREAM_WS_URL` → `src/config/events/socket/index.ts` |
| Transport | `src/events/socket/socket-transport.ts` |
| Outbound | `postSocketOutbound(message)` |
| Listen hook | `src/hooks/events/socket/use-websocket-stream-event.ts` |
| Store | `src/store/events/socket/index.ts` |

Started only when `socketEventsConfig.url` is non-empty (`isSocketConfigured()`).

---

## Client-to-server flow

```
App calls postSocketOutbound(WebSocketOutboundEvent)
  → liveSocket.send(JSON.stringify(envelope))
  → Server receives JSON text frame
```

**Auto pong:** On inbound `ping`, transport replies with `pong` (echo optional `payload.id`) without requiring app code:

```
onmessage → publishRawStreamPayload(..., "websocket")
  → if type === "ping"
  → postSocketOutbound({ type: "pong", payload: { id }, metadata: nextStreamOutboundMetadata() })
```

---

## Server-to-client flow

```
Server sends JSON text frame
  → ReconnectingWebSocket "message"
  → JSON.parse → publishRawStreamPayload(raw, "websocket")
  → normalizeInboundEnvelope → store + subscribers
```

---

## Data types returned to the client

**Inbound / outbound maps:** `StreamWebSocketEventMap` in `src/types/events/payloads.ts`

| `type` | Payload | Direction |
|--------|---------|-----------|
| `notification` | `StreamNotificationPayload` — `{ title, body? }` | Both |
| `hello` | `StreamHelloPayload` — `{ message, from? }` | Both |
| `ping` | `StreamPingPayload` — `{ id? }` | Both |
| `pong` | `StreamPongPayload` — `{ id? }` | Both |

Aliases: `WebSocketStreamEvent`, `WebSocketOutboundEvent` in `src/types/events/socket/index.ts`.

Inbound metadata after normalize includes `code` (e.g. `websocket:notification`).

---

## Security model

| Control | Detail |
|---------|--------|
| Input validation | Zod map `inboundPayloadBySource.websocket` in `normalize-inbound.ts` |
| Auth | Use `wss://` and server-side session/cookie or subprotocol as defined by backend; URL from env at build time |
| Reject | Non-string frame, invalid JSON, or failed Zod → silent drop (no store update) |

---

## Summary

WebSocket is the **primary bidirectional** realtime channel: notifications, hello demo events, and **heartbeat ping/pong** (with automatic client pong on server ping).
