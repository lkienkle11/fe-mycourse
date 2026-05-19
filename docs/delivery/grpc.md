# gRPC / NDJSON Stream Delivery

_Last audited: 2026-05-19._

---

## Introduction

**Interim** client implementation: **HTTP GET** + **NDJSON** (one JSON object per line), not binary gRPC-Web yet. Serves as a gateway-shaped stream until Connect/gRPC-Web is wired.

---

## Implementation details

| Item | Location |
|------|----------|
| Env | `NEXT_PUBLIC_STREAM_GRPC_BASE_URL` → `src/config/events/gRPC/index.ts` |
| Stream path | `/v1/events/stream` (appended to base URL) |
| URL join | `src/events/core/join-url.ts` |
| Transport | `src/events/gRPC/grpc-transport.ts` |
| Listen hook | `src/hooks/events/gRPC/use-grpc-stream-event.ts` |
| Store | `src/store/events/gRPC/index.ts` |

Request: `GET ${baseUrl}/v1/events/stream`, `Accept: application/x-ndjson`, `credentials: "include"`.

---

## Client-to-server flow

**Not implemented on this stream** (read-only GET). Outbound types (`GrpcOutboundEvent`) mirror SSE/WS for future unary/streaming RPC.

---

## Server-to-client flow

```
fetch(stream URL, { credentials: "include" })
  → ReadableStream reader
  → split by newline
  → JSON.parse each line
  → publishRawStreamPayload(raw, "gRPC")
  → normalize → store + subscribers
```

On abort (unmount) or network error, loop ends silently.

---

## Data types returned to the client

Uses **`StreamChannelEventMap`** (no ping/pong on gRPC path today):

| `type` | Payload |
|--------|---------|
| `notification` | `StreamNotificationPayload` |
| `hello` | `StreamHelloPayload` |

Types: `GrpcStreamEvent`, `GrpcOutboundEvent` in `src/types/events/gRPC/index.ts`.

---

## Security model

| Control | Detail |
|---------|--------|
| Input validation | Zod `gRPC` schemas in `normalize-inbound.ts` |
| Auth | Cookie session via `credentials: "include"` — align with API auth cookies |
| Reject | Empty lines, bad JSON, validation failure → line skipped |

---

## Planned integration

- Replace NDJSON fetch with **gRPC-Web** or **Connect** client when backend exposes it.
- Update this doc and `grpc-transport.ts`; keep `StreamEvent` envelope where possible.

---

## Summary

gRPC folder is a **demo NDJSON stream** sharing the same envelope and hooks as SSE/WS; ping/pong not enabled on this source until proto defines them.
