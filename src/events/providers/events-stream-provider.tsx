"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

import { startStreamEventTransports } from "@/events/registry/start-stream-transports";

type EventsStreamProviderProps = {
  children: ReactNode;
};

/**
 * Gắn vào root provider: khởi chạy broadcast + các stream có env hợp lệ.
 */
export function EventsStreamProvider({ children }: EventsStreamProviderProps) {
  useEffect(() => {
    return startStreamEventTransports();
  }, []);

  return <>{children}</>;
}
