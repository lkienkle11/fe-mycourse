import { setupServer } from "msw/node";

/** Shared MSW server instance. Lifecycle (listen/reset/close) is wired in `jest.setup.ts`. */
export const server = setupServer();
