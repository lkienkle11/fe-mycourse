"use client";

import type { GrpcStreamEvent } from "@/types/events";

import type { StreamEventSubscribeInput } from "../use-stream-event";
import { useStreamEvent } from "../use-stream-event";

type GrpcType = GrpcStreamEvent["type"];

function toGrpcInput(
  input: StreamEventSubscribeInput<GrpcStreamEvent>,
): StreamEventSubscribeInput<GrpcStreamEvent> {
  if (typeof input === "function") {
    return (e) => {
      if (e.source === "gRPC") {
        input(e);
      }
    };
  }
  if (Array.isArray(input)) {
    return input.map(({ order, handler }) => ({
      order,
      handler: (e) => {
        if (e.source === "gRPC") {
          handler(e);
        }
      },
    }));
  }
  return {
    order: input.order,
    handler: (e) => {
      if (e.source === "gRPC") {
        input.handler(e);
      }
    },
  };
}

export function useGrpcStreamEvent(
  type: GrpcType | undefined,
  input: StreamEventSubscribeInput<GrpcStreamEvent>,
): void {
  useStreamEvent(
    type ? { source: "gRPC", type } : { source: "gRPC" },
    toGrpcInput(input),
  );
}
