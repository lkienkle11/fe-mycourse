"use client";

import type { GrpcStreamEvent } from "@/types/events";
import { createScopedStreamEventHook } from "../internal/create-scoped-stream-event-hook";

type GrpcType = GrpcStreamEvent["type"];
export const useGrpcStreamEvent: (
  type: GrpcType | undefined,
  input: Parameters<
    ReturnType<typeof createScopedStreamEventHook<"gRPC", GrpcStreamEvent>>
  >[1],
) => void = createScopedStreamEventHook<"gRPC", GrpcStreamEvent>("gRPC");
