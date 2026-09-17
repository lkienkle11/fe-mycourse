import { describe, expect, it, jest } from "@jest/globals";
import { normalizeInboundEnvelope } from "./normalize-inbound";

function nextSeqFrom(start: number) {
  let seq = start;
  return jest.fn(() => seq++);
}

describe("normalizeInboundEnvelope", () => {
  it("normalizes an allowed (source, type) combination with its declared payload schema", () => {
    const result = normalizeInboundEnvelope(
      {
        source: "sse",
        type: "notification",
        payload: { title: "Hello", body: "World" },
      },
      { nextSeq: nextSeqFrom(1) },
    );

    expect(result).toEqual({
      source: "sse",
      type: "notification",
      payload: { title: "Hello", body: "World" },
      metadata: {
        timestamp: expect.any(Number),
        seq: 1,
        code: "sse:notification",
      },
    });
  });

  it("rejects a type not allowed for the given source", () => {
    // "ping" is allowed for websocket, not for sse.
    const result = normalizeInboundEnvelope(
      { source: "sse", type: "ping", payload: { id: "1" } },
      { nextSeq: nextSeqFrom(1) },
    );

    expect(result).toBeNull();
  });

  it("rejects a payload that fails the declared schema for that type", () => {
    const result = normalizeInboundEnvelope(
      { source: "sse", type: "notification", payload: { body: "no title" } },
      { nextSeq: nextSeqFrom(1) },
    );

    expect(result).toBeNull();
  });

  it("rejects an envelope that fails the outer schema (missing type)", () => {
    const result = normalizeInboundEnvelope(
      { source: "sse", payload: {} },
      { nextSeq: nextSeqFrom(1) },
    );

    expect(result).toBeNull();
  });

  it("falls back to defaultSource when the envelope omits source", () => {
    const result = normalizeInboundEnvelope(
      { type: "logout", payload: { reason: "expired" } },
      { defaultSource: "broadcast", nextSeq: nextSeqFrom(1) },
    );

    expect(result).toEqual({
      source: "broadcast",
      type: "logout",
      payload: { reason: "expired" },
      metadata: {
        timestamp: expect.any(Number),
        seq: 1,
        code: "broadcast:logout",
      },
    });
  });

  it("rejects when source is omitted and no defaultSource is configured", () => {
    const result = normalizeInboundEnvelope(
      { type: "logout", payload: {} },
      { nextSeq: nextSeqFrom(1) },
    );

    expect(result).toBeNull();
  });

  it("assigns a new seq via nextSeq() when metadata.seq is absent", () => {
    const nextSeq = nextSeqFrom(42);
    const result = normalizeInboundEnvelope(
      { source: "broadcast", type: "logout", payload: {} },
      { nextSeq },
    );

    expect(nextSeq).toHaveBeenCalledTimes(1);
    expect(result?.metadata.seq).toBe(42);
  });

  it("preserves explicit metadata (timestamp, seq, code) instead of generating defaults", () => {
    const nextSeq = nextSeqFrom(1);
    const result = normalizeInboundEnvelope(
      {
        source: "broadcast",
        type: "logout",
        payload: {},
        metadata: { timestamp: 12345, seq: 999, code: "custom:code" },
      },
      { nextSeq },
    );

    expect(nextSeq).not.toHaveBeenCalled();
    expect(result?.metadata).toEqual({
      timestamp: 12345,
      seq: 999,
      code: "custom:code",
    });
  });
});
