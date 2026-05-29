# BroadcastChannel Delivery

_Last audited: 2026-05-29 (stub unchanged)._

---

## Introduction

**BroadcastChannel** synchronizes realtime events between **tabs of the same origin** (e.g. logout in one tab, confirm in another). It does not reach the server or other domains.

Introduced in commit `16cfa594` (`feat: websocket v1` — includes full stream stack).

---

## Implementation details

| Item | Location |
|------|----------|
| Config | `src/config/events/broadcast/index.ts` — `enabled: true`, `channelName: "mycourse:stream-events"` |
| Transport | `src/events/broadcast/broadcast-transport.ts` |
| Registry | `src/events/registry/start-stream-transports.ts` (always started when enabled) |
| Outbound API | `postBroadcastOutbound()` |
| Send hook | `src/hooks/events/broadcast/use-send-broadcast-outbound.ts` |
| Listen hook | `src/hooks/events/broadcast/use-broadcast-stream-event.ts` |
| Store selector | `src/store/events/broadcast/index.ts` → `useLastBroadcastStreamEvent()` |

Wire format: JSON string on `BroadcastChannel.postMessage`. Inbound may omit `source`; normalize uses `defaultSource: "broadcast"`.

---

## Client-to-server flow

**Not applicable** — BroadcastChannel is browser-only; no server hop.

---

## Server-to-client flow

**Not applicable** — same as above.

---

## Tab-to-tab flows

### Inbound (another tab → this tab)

```
Tab A: postBroadcastOutbound(envelope)
  → BroadcastChannel.postMessage(JSON.stringify(envelope))
Tab B: channel.onmessage
  → JSON.parse (if string)
  → publishRawStreamPayload(raw, "broadcast")
  → StreamEvent in store + subscribers
```

### Outbound (this tab → other tabs)

```
useSendBroadcastOutbound() / postBroadcastOutbound()
  → envelope { source, type, payload, metadata }
  → BroadcastChannel
```

---

## Data types returned to the client

**Inbound (`BroadcastStreamEvent`):**

| `type` | Payload type |
|--------|----------------|
| `logout` | `BroadcastLogoutPayload` — `{ reason?: string }` |
| `confirm_success` | `BroadcastConfirmSuccessPayload` — `{ messageId: string }` |

**Outbound (`BroadcastOutboundEvent`):** same `type` / `payload`; `metadata` without `code`.

Types: `src/types/events/broadcast/index.ts` via `StreamInboundEventOf` / `StreamOutboundEventOf`.

Zod: `src/events/core/normalize-inbound.ts` (`broadcastLogoutPayload`, `broadcastConfirmPayload`).

---

## Security model

| Control | Detail |
|---------|--------|
| Input validation | Zod per type; invalid → dropped |
| Auth/authz | Same-origin policy only; no token on channel — trust same app instance |
| Reject | Non-JSON string ignored; missing `source` filled by `defaultSource` |

---

## Summary

BroadcastChannel is the **lightweight multi-tab bus** for auth/session UX (logout sync, cross-tab confirm). It shares the global `StreamEvent` pipeline with SSE/WebSocket/gRPC.

**Logout:** The tab at `/{locale}/logout` calls `logoutAction`, then `sendBroadcast({ type: "logout", payload: { reason: "user" } })`. `AuthLogoutTabSync` in other tabs runs `clearAuthCookiesClient`, `mutateMe()`, and `window.location.reload()`.
