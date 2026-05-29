# Long Polling

_Last audited: 2026-05-29 (stub unchanged)._

---

## Introduction

Dedicated long-polling transport is **not implemented**. The app uses **SWR** for short HTTP polling/revalidation of REST resources, which is not the same as a long-poll event channel.

---

## Implementation details

**Not implemented** for realtime envelopes.

Related (REST): `swr` in `AppProviders` — see [`flow.md`](../flow.md) auth section.

---

## Client-to-server flow

**Not implemented** for stream events.

---

## Server-to-client flow

**Not implemented** for stream events.

---

## Data types returned to the client

**Not implemented** for stream events.

---

## Security model (prerequisites)

- Time-bounded hold requests; auth on each poll.
- Idempotent handlers; validate body same as WebSocket envelope.

---

## Planned integration points

- Optional fallback when SSE/WebSocket blocked by corporate proxy.
- `src/events/long-polling/` with shared `publishRawStreamPayload` pipeline.

---

## Summary

**Not implemented** — prefer [`sse.md`](./sse.md) or [`websocket.md`](./websocket.md) for push.
