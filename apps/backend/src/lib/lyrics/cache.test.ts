import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { Value } from "@sinclair/typebox/value";
import { redis } from "@/db/redis";
import type { Lyrics } from "@/lib/lyrics/schema";
import { SongLyricsSchema, InstrumentalSchema } from "@/lib/lyrics/schema";
import { setupRedisTestEnv } from "@/test/db/redis";
import {
  getLyricsFromCache,
  setRedisCache,
  clearTrackCache,
  clearLinkedTrackCache,
  withSingleFlight,
  waitForWakeup,
  withLock,
  NOT_FOUND,
  INSTRUMENTAL,
} from "@/lib/lyrics/cache";
import { fetchTrackRecordFromDb } from "@/lib/lyrics/db";
import { fetchAndStoreLyrics } from "@/lib/lyrics/fetch";
import {
  SPOTIFY_CACHE_PREFIX,
  REDIS_NOT_FOUND_MARKER,
  REDIS_INSTRUMENTAL_MARKER,
} from "@/constants";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

setupRedisTestEnv();

describe("Lyrics Cache System (Integration)", () => {
  const VOCAL_TRACK_ID = "4cOdK2wGLETKBW3PvgPWqT";
  const cacheKey = "test:cache:vocal";
  const cacheKeys = [cacheKey, "test:cache:linked_1", "test:cache:linked_2"];

  let realVocal: Lyrics;
  let realSerialized: string;

  const waitForLock = async (id: string, timeoutMs = 5000) => {
    const deadline = Date.now() + timeoutMs;
    const poll = async (): Promise<boolean> => {
      if (Date.now() >= deadline) return false;
      if (await redis.get(`lyrics:lock:${id}`)) return true;
      await sleep(25);
      return poll();
    };
    return poll();
  };

  beforeAll(async () => {
    const vocal = await fetchAndStoreLyrics(VOCAL_TRACK_ID, null);
    if (vocal.status !== "success") {
      throw new Error(`Expected real lyrics for ${VOCAL_TRACK_ID}, got ${vocal.status}`);
    }
    expect(Value.Check(SongLyricsSchema, vocal.data)).toBe(true);
    realVocal = vocal.data as Lyrics;
    realSerialized = JSON.stringify(realVocal);
  }, 120_000);

  beforeEach(async () => {
    await Promise.all(
      cacheKeys.map(async (k) => {
        await redis.del(`${SPOTIFY_CACHE_PREFIX}${k}`);
        await redis.del(`lyrics:lock:${k}`);
        await clearTrackCache(k);
      }),
    );
  });

  afterAll(async () => {
    await Promise.all(
      cacheKeys.map(async (k) => {
        await redis.del(`${SPOTIFY_CACHE_PREFIX}${k}`);
        await redis.del(`lyrics:lock:${k}`);
        await clearTrackCache(k);
      }),
    );
  });

  describe("getLyricsFromCache & setRedisCache", () => {
    it("returns null on a cold cache miss", async () => {
      const result = await getLyricsFromCache(cacheKey);
      expect(result).toBeNull();
    });

    it("round-trips real fetched lyrics through L1 memory and L2 Redis", async () => {
      await setRedisCache(cacheKey, 60, realSerialized);

      const result = await getLyricsFromCache(cacheKey);
      expect(result).toEqual({ status: "success", data: realVocal });

      // Wipe L1 memory, then read straight from the L2 Redis bytes
      await clearTrackCache(cacheKey);
      await redis.setex(`${SPOTIFY_CACHE_PREFIX}${cacheKey}`, 60, realSerialized);
      const redisOnlyResult = await getLyricsFromCache(cacheKey);
      expect(redisOnlyResult).toEqual({ status: "success", data: realVocal });
    });

    it("turns the NOT_FOUND marker into a typed error response", async () => {
      await setRedisCache(cacheKey, 60, REDIS_NOT_FOUND_MARKER);

      const result = await getLyricsFromCache(cacheKey);
      expect(result).toEqual(NOT_FOUND);
    });

    it("turns the INSTRUMENTAL marker into a schema-valid instrumental response", async () => {
      await setRedisCache(cacheKey, 60, REDIS_INSTRUMENTAL_MARKER);

      const result = await getLyricsFromCache(cacheKey);
      expect(result).toEqual(INSTRUMENTAL);
      if (result?.status === "success") {
        expect(Value.Check(InstrumentalSchema, result.data)).toBe(true);
      }
    });
  });

  describe("Cache Clearing", () => {
    it("clears a single cached track", async () => {
      await setRedisCache(cacheKey, 60, realSerialized);
      await clearTrackCache(cacheKey);

      const result = await getLyricsFromCache(cacheKey);
      expect(result).toBeNull();
    });

    it("clears multiple linked tracks simultaneously", async () => {
      const linked = ["test:cache:linked_1", "test:cache:linked_2"];
      await Promise.all(linked.map((k) => setRedisCache(k, 60, realSerialized)));

      await clearLinkedTrackCache(linked);

      const results = await Promise.all(linked.map((k) => getLyricsFromCache(k)));
      for (const result of results) {
        expect(result).toBeNull();
      }
    });
  });

  describe("withSingleFlight", () => {
    it("deduplicates concurrent real DB fetches into a single execution", async () => {
      let fetchCount = 0;
      const fetchRecord = () => {
        fetchCount += 1;
        return fetchTrackRecordFromDb(VOCAL_TRACK_ID);
      };

      const results = await Promise.all([
        withSingleFlight(VOCAL_TRACK_ID, fetchRecord),
        withSingleFlight(VOCAL_TRACK_ID, fetchRecord),
        withSingleFlight(VOCAL_TRACK_ID, fetchRecord),
      ]);

      expect(fetchCount).toBe(1);
      expect(results[0]).toEqual(results[1]);
      expect(results[0]).toEqual(results[2]);
      expect(results[0]?.hasLyrics).toBe(true);
    });
  });

  describe("withLock & waitForWakeup", () => {
    it("executes onAcquire when the lock is free and releases it atomically", async () => {
      const track = await withLock(
        cacheKey,
        () => fetchTrackRecordFromDb(VOCAL_TRACK_ID),
        () => {
          throw new Error("onWait should not run when the lock is free");
        },
      );

      expect(track?.hasLyrics).toBe(true);
      expect(await redis.get(`lyrics:lock:${cacheKey}`)).toBeNull();
    });

    it("falls back to onWait when another worker already holds the lock", async () => {
      let release!: () => void;
      const holder = withLock(
        cacheKey,
        () =>
          new Promise<void>((resolve) => {
            release = resolve;
          }),
        async () => undefined,
      );
      expect(await waitForLock(cacheKey)).toBe(true);

      let waitCalled = false;
      const result = await withLock(
        cacheKey,
        async () => "acquire_result",
        async () => {
          waitCalled = true;
          return "wait_result";
        },
      );

      expect(waitCalled).toBe(true);
      expect(result).toBe("wait_result");

      release();
      await holder;
    });

    it("returns the cached value while waiting when the lock is already held", async () => {
      let release!: () => void;
      const holder = withLock(
        cacheKey,
        () =>
          new Promise<void>((resolve) => {
            release = resolve;
          }),
        async () => undefined,
      );
      expect(await waitForLock(cacheKey)).toBe(true);

      await setRedisCache(cacheKey, 60, realSerialized);

      const result = await withLock(
        cacheKey,
        async () => "acquire_branch",
        async () => "wait_branch",
      );

      expect(result).toEqual({ status: "success", data: realVocal });

      release();
      await holder;
    });

    it("publishes to LYRICS_CHANNEL and wakes up waiters via waitForWakeup", async () => {
      const wakeupPromise = waitForWakeup(cacheKey, 5000);

      await withLock(
        cacheKey,
        async () => {
          await setRedisCache(cacheKey, 60, realSerialized);
          return true;
        },
        async () => false,
      );

      await expect(wakeupPromise).resolves.toBeUndefined();
    });
  });
});
