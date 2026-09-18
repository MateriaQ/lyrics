import { describe, it, expect } from "vitest";
import { AppleFetch } from "@/lib/apple/fetch";
import env from "@/env";

describe.skipIf(env.CI)("AppleFetch Live Token Checks", () => {
  it("has non-empty credentials in the environment", () => {
    expect(env.APPLE_AUTH_TOKEN).toBeDefined();
    expect(env.APPLE_AUTH_TOKEN.length).toBeGreaterThan(16);
    expect(env.APPLE_MEDIA_USER_TOKEN).toBeDefined();
    expect(env.APPLE_MEDIA_USER_TOKEN.length).toBeGreaterThan(16);
  });

  it("authenticates successfully with Apple API (developer & user tokens are valid)", async () => {
    const storefront = env.APPLE_STOREFRONT;
    const testSongId = "1559523359";
    const url = `https://amp-api.music.apple.com/v1/catalog/${storefront}/songs/${testSongId}`;

    const res = await AppleFetch(url);
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);

    expect(res.ok).toBe(true);
  }, 15000);
});
