#!/usr/bin/env node
/**
 * `test:e2e` process lifecycle: start the loopback fixture backend, build the
 * Next app against it (NEXT_PUBLIC_API_URL must be baked in at build time),
 * start the production server, wait for both to be ready, run Playwright,
 * then tear everything down — on success *or* failure.
 */
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { start as startFixtureBackend } from "../e2e/fixtures/server.mjs";

const FIXTURE_PORT = 4100;
const APP_PORT = 4200;
const FIXTURE_URL = `http://localhost:${FIXTURE_PORT}`;
const APP_URL = `http://localhost:${APP_PORT}`;
const READY_TIMEOUT_MS = 120_000;
const READY_POLL_MS = 500;

/** @type {Array<() => Promise<void> | void>} */
const cleanups = [];

async function runCleanups() {
  while (cleanups.length > 0) {
    const cleanup = cleanups.pop();
    try {
      await cleanup?.();
    } catch (error) {
      console.error("[e2e-lifecycle] cleanup step failed:", error);
    }
  }
}

function spawnChild(label, command, args, env) {
  console.log(
    `[e2e-lifecycle] starting ${label}: ${command} ${args.join(" ")}`,
  );
  const child = spawn(command, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  cleanups.push(
    () =>
      new Promise((resolve) => {
        if (child.exitCode !== null || child.killed) return resolve();
        child.once("exit", () => resolve());
        child.kill("SIGTERM");
        setTimeout(() => {
          if (child.exitCode === null) child.kill("SIGKILL");
          resolve();
        }, 5000);
      }),
  );
  return child;
}

async function waitForReady(url, label) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.status < 500) {
        console.log(`[e2e-lifecycle] ${label} ready (${response.status})`);
        return;
      }
    } catch {
      // not up yet
    }
    await delay(READY_POLL_MS);
  }
  throw new Error(
    `[e2e-lifecycle] ${label} did not become ready within ${READY_TIMEOUT_MS}ms`,
  );
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once("exit", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`process exited with code ${code}`));
    });
    child.once("error", reject);
  });
}

async function main() {
  let exitCode = 1;
  try {
    console.log("[e2e-lifecycle] starting fixture backend (in-process)");
    const fixtureServer = await startFixtureBackend(FIXTURE_PORT);
    cleanups.push(
      () => new Promise((resolve) => fixtureServer.close(() => resolve())),
    );
    await waitForReady(`${FIXTURE_URL}/api/v1/me`, "fixture backend");

    const buildEnv = { NEXT_PUBLIC_API_URL: FIXTURE_URL };
    const build = spawnChild("next build", "npx", ["next", "build"], buildEnv);
    await waitForExit(build);

    const serverEnv = {
      NEXT_PUBLIC_API_URL: FIXTURE_URL,
      PORT: String(APP_PORT),
    };
    spawnChild(
      "next start",
      "npx",
      ["next", "start", "-p", String(APP_PORT)],
      serverEnv,
    );
    await waitForReady(APP_URL, "Next app");

    console.log("[e2e-lifecycle] running Playwright");
    const playwright = spawnChild(
      "playwright test",
      "npx",
      ["playwright", "test"],
      { E2E_BASE_URL: APP_URL, E2E_FIXTURE_URL: FIXTURE_URL },
    );
    await waitForExit(playwright);
    exitCode = 0;
  } catch (error) {
    console.error("[e2e-lifecycle] failed:", error);
    exitCode = 1;
  } finally {
    await runCleanups();
  }
  process.exit(exitCode);
}

await main();
