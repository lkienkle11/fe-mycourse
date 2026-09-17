/**
 * `undici` (loaded next, in `jest.setup.jsdom-fetch.ts`) reads
 * `TextEncoder`/`TextDecoder`/Web Streams off `globalThis` at module-load
 * time, and jsdom implements none of them. Each `setupFiles` entry is fully
 * evaluated (including side effects) before the next one starts, so putting
 * this in its own file — ordered before the fetch polyfill — guarantees
 * these exist first, which a single file with static imports cannot.
 */

import {
  ReadableStream,
  TransformStream,
  WritableStream,
} from "node:stream/web";
import { TextDecoder, TextEncoder } from "node:util";
import {
  BroadcastChannel,
  MessageChannel,
  MessagePort,
} from "node:worker_threads";

// MSW's WebSocket interceptor (`msw/core/ws`) needs `BroadcastChannel` at
// module-load time; jsdom's test environment does not expose Node's own
// global for it. `MessageChannel`/`MessagePort` are for `undici` below —
// note this is what makes React's scheduler opt into MessageChannel-based
// scheduling, which `--forceExit` on the jsdom test script accounts for
// (a real but harmless handle, not a test leak).
Object.assign(globalThis, {
  TextEncoder,
  TextDecoder,
  ReadableStream,
  WritableStream,
  TransformStream,
  MessageChannel,
  MessagePort,
  BroadcastChannel,
});
