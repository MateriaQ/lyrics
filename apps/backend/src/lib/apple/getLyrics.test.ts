import env from "@/env";
import { describe, it, expect } from "vitest";
import { getAppleLyrics } from "@/lib/apple/getLyrics";

describe.skipIf(env.CI)("getAppleLyrics Live Verification", () => {
  it("fetches and parses syllable lyrics for an existing song", async () => {
    const songId = "1559523359";
    const result = await getAppleLyrics(songId);

    expect(result).not.toBeNull();
    expect(result?.data).toBeDefined();
    expect(Array.isArray(result?.data)).toBe(true);
    expect(result!.data.length).toBeGreaterThan(0);

    const lyricItem = result!.data[0];
    expect(lyricItem.type).toBe("syllable-lyrics");
    expect(lyricItem.attributes).toBeDefined();
    expect(lyricItem.attributes.playParams.catalogId).toBe(songId);
    expect(lyricItem.attributes.ttmlLocalizations ?? lyricItem.attributes.ttml).toBeTypeOf(
      "string",
    );
  }, 15000);

  it("returns null when the song does not exist (404 handling)", async () => {
    const dummyId = "0000000000";
    const result = await getAppleLyrics(dummyId);

    expect(result).toBeNull();
  }, 15000);
});
