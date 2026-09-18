import { describe, expect, it } from "vitest";
import { calculateLyricsScore } from "@/lib/lyrics";
import type { Provider } from "@/db/schema/lyrics";
import type { LyricsData } from "@/lib/lyrics/schema";

type LyricType = LyricsData["type"];

const TYPES: LyricType[] = ["static", "line", "syllable"];
const PROVIDERS: Provider[] = ["apple", "amll", "spicy", "cider", "spotify", "musixmatch"];

describe("calculateLyricsScore", () => {
  it("ranks syllable above line above static for every provider", () => {
    for (const provider of PROVIDERS) {
      const syllable = calculateLyricsScore("syllable", provider);
      const line = calculateLyricsScore("line", provider);
      const staticType = calculateLyricsScore("static", provider);

      expect(syllable).toBeGreaterThan(line);
      expect(line).toBeGreaterThan(staticType);
    }
  });

  it("ranks providers by their quality boost for every lyric type", () => {
    for (const type of TYPES) {
      const apple = calculateLyricsScore(type, "apple");
      const spotify = calculateLyricsScore(type, "spotify");
      const musixmatch = calculateLyricsScore(type, "musixmatch");

      expect(apple).toBeGreaterThan(spotify);
      expect(spotify).toBeGreaterThan(musixmatch);
    }
  });

  it("boosts community spicy lyrics above apple and penalizes non-community", () => {
    for (const type of TYPES) {
      const community = calculateLyricsScore(type, "spicy", true);
      const nonCommunity = calculateLyricsScore(type, "spicy", false);
      const apple = calculateLyricsScore(type, "apple");

      expect(community).toBeGreaterThan(apple);
      expect(nonCommunity).toBeLessThan(apple);
    }
  });

  it("treats an unflagged spicy source the same as a non-community one", () => {
    for (const type of TYPES) {
      const unflagged = calculateLyricsScore(type, "spicy");
      const nonCommunity = calculateLyricsScore(type, "spicy", false);

      expect(unflagged).toBe(nonCommunity);
    }
  });

  it("ignores the community flag for non-spicy providers", () => {
    for (const provider of PROVIDERS.filter((p) => p !== "spicy")) {
      for (const type of TYPES) {
        expect(calculateLyricsScore(type, provider)).toBe(
          calculateLyricsScore(type, provider, true),
        );
        expect(calculateLyricsScore(type, provider)).toBe(
          calculateLyricsScore(type, provider, false),
        );
      }
    }
  });
});
