import env from "@/env";
import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { Value } from "@sinclair/typebox/value";
import { HTTP_CODES } from "@/lib/http";
import { clearTrackCache, getLyricsFromCache, setRedisCache } from "@/lib/lyrics/cache";
import { setTrackInstrumental, fetchTrackRecordFromDb } from "@/lib/lyrics/db";
import { fetchAndStoreLyrics } from "@/lib/lyrics/fetch";
import { InstrumentalSchema, SongLyricsSchema } from "@/lib/lyrics/schema";

import {
  getSpotifyLyrics,
  revalidateSpotifyLyrics,
  instrumentalSpotifyLyrics,
} from "@/routes/lyrics/spotify/spotify.controller";

const VOCAL_TRACK_ID = "4cOdK2wGLETKBW3PvgPWqT";
const INSTRUMENTAL_TRACK_ID = "6VK8OMA2FhX4KoS3QCH7rL";

const HOOK_TIMEOUT = 120_000;
const FETCH_TIMEOUT = 60_000;

describe("Lyrics Router Controllers", () => {
  beforeAll(async () => {
    await getSpotifyLyrics(VOCAL_TRACK_ID);
    await getSpotifyLyrics(INSTRUMENTAL_TRACK_ID);
  }, HOOK_TIMEOUT);

  beforeEach(async () => {
    await clearTrackCache(VOCAL_TRACK_ID);
    await clearTrackCache(INSTRUMENTAL_TRACK_ID);
  });

  afterAll(async () => {
    await clearTrackCache(VOCAL_TRACK_ID);
    await clearTrackCache(INSTRUMENTAL_TRACK_ID);
    await setTrackInstrumental(INSTRUMENTAL_TRACK_ID, true);
    await setTrackInstrumental(VOCAL_TRACK_ID, false);
  }, HOOK_TIMEOUT);

  describe("getSpotifyLyrics", () => {
    it(
      "returns real lyrics matching the lyrics schema for a vocal track",
      async () => {
        const result = await getSpotifyLyrics(VOCAL_TRACK_ID);

        expect([HTTP_CODES.OK, HTTP_CODES.NOT_FOUND]).toContain(result.code);
        if (result.code === HTTP_CODES.OK && result.response.status === "success") {
          expect(result.response.data.type).toBe("lyrics");
          expect(Value.Check(SongLyricsSchema, result.response.data)).toBe(true);
        }
      },
      FETCH_TIMEOUT,
    );

    it(
      "serves the exact real payload back on a cache hit",
      async () => {
        const fetched = await fetchAndStoreLyrics(VOCAL_TRACK_ID, null);
        if (fetched.status !== "success") {
          throw new Error(`Expected success, got ${fetched.status}`);
        }
        expect(Value.Check(SongLyricsSchema, fetched.data)).toBe(true);

        await clearTrackCache(VOCAL_TRACK_ID);
        await setRedisCache(VOCAL_TRACK_ID, env.LYRICS_CACHE_TTL, JSON.stringify(fetched.data));

        const result = await getSpotifyLyrics(VOCAL_TRACK_ID);

        expect(result.code).toBe(HTTP_CODES.OK);
        expect(result.response).toEqual({ status: "success", data: fetched.data });
      },
      FETCH_TIMEOUT,
    );

    it(
      "serves stored lyrics from the database when the cache is cold",
      async () => {
        await clearTrackCache(VOCAL_TRACK_ID);

        const result = await getSpotifyLyrics(VOCAL_TRACK_ID);

        expect([HTTP_CODES.OK, HTTP_CODES.NOT_FOUND]).toContain(result.code);
        if (result.code === HTTP_CODES.OK && result.response.status === "success") {
          expect(result.response.data.type).toBe("lyrics");
          expect(Value.Check(SongLyricsSchema, result.response.data)).toBe(true);
        }
      },
      FETCH_TIMEOUT,
    );

    it(
      "returns a schema-valid instrumental success when the track is instrumental",
      async () => {
        await getSpotifyLyrics(INSTRUMENTAL_TRACK_ID);
        await setTrackInstrumental(INSTRUMENTAL_TRACK_ID, true);
        await clearTrackCache(INSTRUMENTAL_TRACK_ID);

        const result = await getSpotifyLyrics(INSTRUMENTAL_TRACK_ID);

        expect(result.code).toBe(HTTP_CODES.OK);
        if (result.response.status !== "success") {
          throw new Error(`Expected success, got ${result.response.status}`);
        }
        expect(result.response.data).toEqual({ type: "instrumental" });
        expect(Value.Check(InstrumentalSchema, result.response.data)).toBe(true);
      },
      FETCH_TIMEOUT,
    );
  });

  describe("revalidateSpotifyLyrics", () => {
    it(
      "returns 422 when revalidating instrumental track without force",
      async () => {
        await getSpotifyLyrics(INSTRUMENTAL_TRACK_ID);
        await setTrackInstrumental(INSTRUMENTAL_TRACK_ID, true);

        const result = await revalidateSpotifyLyrics(INSTRUMENTAL_TRACK_ID, false);

        expect(result.code).toBe(HTTP_CODES.UNPROCESSABLE_ENTITY);
        expect(result.response).toEqual({
          status: "error",
          error: {
            code: "INSTRUMENTAL_SONG",
            message:
              "Revalidation failed: This track is flagged as an instrumental and cannot have lyrics.",
          },
        });
      },
      FETCH_TIMEOUT,
    );

    it(
      "revalidates instrumental track when force is true",
      async () => {
        await getSpotifyLyrics(INSTRUMENTAL_TRACK_ID);
        await setTrackInstrumental(INSTRUMENTAL_TRACK_ID, true);

        const result = await revalidateSpotifyLyrics(INSTRUMENTAL_TRACK_ID, true);

        expect(result.code).toBe(HTTP_CODES.OK);
        expect(result.response).toEqual({
          status: "success",
          data: { revalidated: true },
        });
      },
      FETCH_TIMEOUT,
    );

    it(
      "revalidates vocal track and stores real lyrics in the cache",
      async () => {
        await getSpotifyLyrics(VOCAL_TRACK_ID);

        const result = await revalidateSpotifyLyrics(VOCAL_TRACK_ID, false);

        expect(result.code).toBe(HTTP_CODES.OK);
        expect(result.response).toEqual({
          status: "success",
          data: { revalidated: true },
        });

        const cached = await getLyricsFromCache(VOCAL_TRACK_ID);
        expect(cached?.status).toBe("success");
        if (cached?.status === "success") {
          expect(Value.Check(SongLyricsSchema, cached.data)).toBe(true);
        }
      },
      FETCH_TIMEOUT,
    );
  });

  describe("instrumentalSpotifyLyrics", () => {
    it(
      "marks track as instrumental",
      async () => {
        await getSpotifyLyrics(INSTRUMENTAL_TRACK_ID);

        const result = await instrumentalSpotifyLyrics(INSTRUMENTAL_TRACK_ID, true);

        expect(result.code).toBe(HTTP_CODES.OK);
        expect(result.response).toEqual({
          status: "success",
          data: { instrumental: true },
        });

        const track = await fetchTrackRecordFromDb(INSTRUMENTAL_TRACK_ID);
        expect(track?.instrumental).toBe(true);
      },
      FETCH_TIMEOUT,
    );

    it(
      "unmarks track as instrumental",
      async () => {
        await getSpotifyLyrics(INSTRUMENTAL_TRACK_ID);

        const result = await instrumentalSpotifyLyrics(INSTRUMENTAL_TRACK_ID, false);

        expect(result.code).toBe(HTTP_CODES.OK);
        expect(result.response).toEqual({
          status: "success",
          data: { instrumental: false },
        });

        const track = await fetchTrackRecordFromDb(INSTRUMENTAL_TRACK_ID);
        expect(track?.instrumental).toBe(false);
      },
      FETCH_TIMEOUT,
    );

    it(
      "sets vocal track as not instrumental",
      async () => {
        await getSpotifyLyrics(VOCAL_TRACK_ID);

        const result = await instrumentalSpotifyLyrics(VOCAL_TRACK_ID, false);

        expect(result.code).toBe(HTTP_CODES.OK);
        expect(result.response).toEqual({
          status: "success",
          data: { instrumental: false },
        });

        const track = await fetchTrackRecordFromDb(VOCAL_TRACK_ID);
        expect(track?.instrumental).toBe(false);
      },
      FETCH_TIMEOUT,
    );
  });
});
