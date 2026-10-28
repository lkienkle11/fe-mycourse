import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { broadcastEventsConfig } from "@/config/events/broadcast";
import { BROADCAST_LOGOUT_REASON } from "@/constants/events";
import { startBroadcastTransport } from "@/events/broadcast/broadcast-transport";
import { sendBroadcastOutbound } from "./send-broadcast-outbound";

let receivingChannel: BroadcastChannel;
let stopSendingChannel: (() => void) | undefined;

beforeEach(() => {
  stopSendingChannel = startBroadcastTransport();
  receivingChannel = new BroadcastChannel(broadcastEventsConfig.channelName);
});

afterEach(() => {
  receivingChannel.close();
  stopSendingChannel?.();
  stopSendingChannel = undefined;
});

function nextMessage(): Promise<string> {
  return new Promise((resolve) => {
    receivingChannel.addEventListener(
      "message",
      (event: MessageEvent<string>) => resolve(event.data),
      { once: true },
    );
  });
}

describe("sendBroadcastOutbound", () => {
  it("adds sequence metadata and sends a session-expired logout", async () => {
    const message = nextMessage();
    sendBroadcastOutbound({
      source: "broadcast",
      type: "logout",
      payload: { reason: BROADCAST_LOGOUT_REASON.sessionExpired },
    });

    const event = JSON.parse(await message);

    expect(event).toMatchObject({
      source: "broadcast",
      type: "logout",
      payload: { reason: "session_expired" },
      metadata: {
        seq: expect.any(Number),
        timestamp: expect.any(Number),
      },
    });
  });

  it("preserves explicit metadata", async () => {
    const message = nextMessage();
    const metadata = { seq: 17, timestamp: 1234 };
    sendBroadcastOutbound({
      source: "broadcast",
      type: "logout",
      payload: { reason: BROADCAST_LOGOUT_REASON.user },
      metadata,
    });

    const event = JSON.parse(await message);

    expect(event.metadata).toEqual(metadata);
  });

  it("sends confirm_success messages", async () => {
    const message = nextMessage();
    sendBroadcastOutbound({
      source: "broadcast",
      type: "confirm_success",
      payload: { messageId: "m1" },
    });

    const event = JSON.parse(await message);

    expect(event).toMatchObject({
      source: "broadcast",
      type: "confirm_success",
      payload: { messageId: "m1" },
    });
  });
});
