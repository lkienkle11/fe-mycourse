# MQTT

_Last audited: 2026-05-29 (stub unchanged)._

---

## Introduction

MQTT client transport is **not implemented** in `fe-mycourse`.

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

**Not implemented.**

---

## Security model (prerequisites)

- TLS (MQTTS), client certificates or username/password from secure env (not `NEXT_PUBLIC_*` for secrets).
- Topic ACLs on broker; no wildcard subscribe from browser without auth.
- Payload validation before mapping to `StreamEvent`.

---

## Planned integration points

- Broker URL via server-side proxy or WebSocket bridge (browsers rarely use raw MQTT).
- `src/events/mqtt/` + env in `src/constants/events/index.ts`.
- Map MQTT topics → `source` + `type` in `normalize-inbound.ts`.

---

## Summary

**Not implemented** — no MQTT dependency in `package.json` as of stream v1.
