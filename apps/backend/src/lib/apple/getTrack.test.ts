import env from "@/env";
import { describe, it, expect } from "vitest";
import { searchTracksISRC, searchSongs } from "@/lib/apple/searchTrack";

describe.skipIf(env.CI)("Apple API Live Verification", () => {
  describe("searchTracksISRC", () => {
    it("fetches and parses data for an existing ISRC", async () => {
      const isrc = "GBARL9300135";
      const result = await searchTracksISRC(isrc);

      expect(result).not.toBeNull();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      const song = result.data[0];
      expect(song.type).toBe("songs");
      expect(song.attributes).toBeDefined();
      expect(song.attributes.isrc).toBe(isrc);
      expect(song.attributes.name).toBeTypeOf("string");
    }, 15000);

    it("returns an empty data array when the ISRC does not exist", async () => {
      const dummyISRC = "INVALID00000";
      const result = await searchTracksISRC(dummyISRC);

      expect(result).not.toBeNull();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(0);
    }, 15000);
  });

  describe("searchSongs", () => {
    it("fetches and parses data for a valid search term", async () => {
      const term = "Beatles";
      const result = await searchSongs(term);

      expect(result).not.toBeNull();
      expect(result.results).toBeDefined();

      expect(result.results.songs).toBeDefined();
      expect(Array.isArray(result.results.songs?.data)).toBe(true);
      expect(result.results.songs!.data.length).toBeGreaterThan(0);

      const firstSong = result.results.songs!.data[0];
      expect(firstSong.type).toBe("songs");
      expect(firstSong.attributes).toBeDefined();
      expect(firstSong.attributes.name).toBeTypeOf("string");
      expect(firstSong.attributes.artistName).toBeTypeOf("string");
    }, 15000);
  });
});
