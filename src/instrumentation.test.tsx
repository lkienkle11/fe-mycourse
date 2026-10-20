import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { register } from "./instrumentation";

const KEYS = ["NEXT_RUNTIME", "NEXT_PHASE", "SITE_URL"] as const;
const saved = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));

function setEnv(env: Record<string, string | undefined>, nodeEnv: string) {
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  jest.replaceProperty(process.env, "NODE_ENV", nodeEnv as "production");
}

let exit: jest.SpiedFunction<typeof process.exit>;
let logError: jest.SpiedFunction<typeof console.error>;

beforeEach(() => {
  exit = jest
    .spyOn(process, "exit")
    .mockImplementation((() => undefined) as never);
  logError = jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
  for (const key of KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("register", () => {
  it("logs the reason and exits 1 for a production node server without SITE_URL", async () => {
    setEnv({ NEXT_RUNTIME: "nodejs", NEXT_PHASE: undefined }, "production");
    delete process.env.SITE_URL;

    await register();

    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining("SITE_URL must be a pure public https:// origin"),
    );
    expect(exit).toHaveBeenCalledWith(1);
  });

  it("exits 1 for an invalid SITE_URL in production", async () => {
    setEnv(
      { NEXT_RUNTIME: "nodejs", SITE_URL: "http://localhost:3000" },
      "production",
    );

    await register();

    expect(exit).toHaveBeenCalledWith(1);
  });

  it("starts with a valid https origin", async () => {
    setEnv(
      { NEXT_RUNTIME: "nodejs", SITE_URL: "https://example.com" },
      "production",
    );

    await register();

    expect(exit).not.toHaveBeenCalled();
  });

  it("does not validate during next build", async () => {
    setEnv(
      { NEXT_RUNTIME: "nodejs", NEXT_PHASE: "phase-production-build" },
      "production",
    );
    delete process.env.SITE_URL;

    await register();

    expect(exit).not.toHaveBeenCalled();
  });

  it("does not validate on the edge runtime or outside production", async () => {
    setEnv({ NEXT_RUNTIME: "edge", NEXT_PHASE: undefined }, "production");
    delete process.env.SITE_URL;
    await register();

    setEnv({ NEXT_RUNTIME: "nodejs" }, "development");
    await register();

    expect(exit).not.toHaveBeenCalled();
  });
});
