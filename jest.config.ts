import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const moduleNameMapper = {
  "^@/(.*)$": "<rootDir>/src/$1",
  "^@public/(.*)$": "<rootDir>/public/$1",
};

/** Selected-scope coverage per the behavior matrix — not whole-repo coverage. */
const collectCoverageFrom = [
  "src/api/auth/**/*.ts",
  "src/api/transport/**/*.ts",
  "src/app/api/auth/refresh/**/*.ts",
  "src/lib/utils/permission.ts",
  "src/hooks/course/**/*.ts",
  "src/api/hooks/shared.ts",
  "src/store/auth/**/*.ts",
];

const nodeConfig: Config = {
  displayName: "node",
  testEnvironment: "node",
  moduleNameMapper,
  collectCoverageFrom,
  coverageDirectory: "<rootDir>/coverage/node",
  setupFiles: ["<rootDir>/src/test-support/jest.setup.node.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/test-support/jest.setup.ts"],
  testMatch: [
    "<rootDir>/src/api/auth/**/*.test.ts",
    "<rootDir>/src/api/transport/**/*.test.ts",
    "<rootDir>/src/app/api/auth/**/*.test.ts",
  ],
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/e2e/",
    // Browser-only modules (need `window`) run under the jsdom project instead.
    "<rootDir>/src/api/auth/browser-.*\\.test\\.ts$",
  ],
};

const jsdomConfig: Config = {
  displayName: "jsdom",
  testEnvironment: "jsdom",
  moduleNameMapper,
  collectCoverageFrom,
  coverageDirectory: "<rootDir>/coverage/jsdom",
  setupFiles: [
    "<rootDir>/src/test-support/jest.setup.jsdom-encoding.ts",
    "<rootDir>/src/test-support/jest.setup.jsdom-fetch.ts",
  ],
  setupFilesAfterEnv: ["<rootDir>/src/test-support/jest.setup.ts"],
  testMatch: [
    "<rootDir>/src/**/*.test.tsx",
    "<rootDir>/src/lib/**/*.test.ts",
    "<rootDir>/src/hooks/**/*.test.ts",
    "<rootDir>/src/store/**/*.test.ts",
    "<rootDir>/src/api/hooks/**/*.test.ts",
    "<rootDir>/src/schema/**/*.test.ts",
    "<rootDir>/src/events/**/*.test.ts",
    "<rootDir>/src/api/callers/**/*.test.ts",
    // Browser-only auth modules (need `window`) — see nodeConfig's counterpart ignore.
    "<rootDir>/src/api/auth/browser-*.test.ts",
  ],
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/e2e/",
    "<rootDir>/src/api/transport/",
    "<rootDir>/src/app/api/auth/",
  ],
};

/**
 * Single canonical `jest.config.ts` so Knip's built-in Jest plugin (which only
 * recognizes the literal `jest.config.{ext}` filename) can resolve
 * `setupFilesAfterEnv` as a real entry point instead of flagging it unused.
 * `JEST_PROJECT=node` selects the Node project; every other value (including
 * unset, e.g. when Knip statically evaluates this file) resolves to jsdom.
 */
const projectConfig = process.env.JEST_PROJECT === "node" ? nodeConfig : jsdomConfig;

export default createJestConfig(projectConfig);
