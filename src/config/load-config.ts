import { eventsConfigSnapshot } from "@/config/events";

export const loadConfig = async () => {
  return {
    events: eventsConfigSnapshot,
  };
};
