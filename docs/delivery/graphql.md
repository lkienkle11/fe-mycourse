# GraphQL Subscriptions

_Last audited: 2026-05-29 (stub unchanged)._

---

## Introduction

GraphQL subscription transport is **not implemented** in `fe-mycourse`.

---

## Implementation details

**Not implemented.**

---

## Client-to-server flow

**Not implemented.**

---

## Server-to-client flow

**Not implemented.**

---

## Data types returned to the client

**Not implemented.** If added, prefer reusing `StreamInboundEventOf` / envelope normalization from `src/types/events/common.ts`.

---

## Security model (prerequisites)

Before implementation:

- Validate subscription payloads server-side; never trust client-selected fields for auth.
- Use WSS and same auth as REST (`Authorization` or session cookie).
- Rate-limit subscription setup per user.

---

## Planned integration points

| Area | Suggested path |
|------|----------------|
| Client | `src/events/graphql/` transport + `config/events/graphql/` |
| Provider | Register in `startStreamEventTransports()` |
| Types | `src/types/events/graphql/index.ts` extending shared maps |
| Docs | Update [`delivery.md`](../delivery.md) status table |

---

## Summary

**Not implemented** — use WebSocket or SSE per [`delivery.md`](../delivery.md) until GraphQL subscriptions are required.
