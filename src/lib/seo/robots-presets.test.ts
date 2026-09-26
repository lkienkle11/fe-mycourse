import { describe, expect, it } from "@jest/globals";
import { robotsModeForPublicRouteKey } from "./robots-presets";

describe("robotsModeForPublicRouteKey", () => {
  it("returns indexable for the SEO-indexable allow-listed key", () => {
    expect(robotsModeForPublicRouteKey("home")).toBe("indexable");
  });

  it("returns noindex for the login and signup route-modal fallback pages", () => {
    expect(robotsModeForPublicRouteKey("login")).toBe("noindex");
    expect(robotsModeForPublicRouteKey("signup")).toBe("noindex");
  });

  it("returns noindex for other auth-adjacent public routes", () => {
    expect(robotsModeForPublicRouteKey("forgotPassword")).toBe("noindex");
    expect(robotsModeForPublicRouteKey("confirmEmail")).toBe("noindex");
    expect(robotsModeForPublicRouteKey("logout")).toBe("noindex");
  });
});
