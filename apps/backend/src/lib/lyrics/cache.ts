import { LRUCache } from "lru-cache";
import { EventEmitter } from "node:events";
import { redis } from "@/db/redis";
import { logger } from "@/logger";
import type { LyricsResponse, WaitlistEmitter } from "@/lib/lyrics/types";
import {
  LYRICS_CHANNEL,
  SPOTIFY_CACHE_PREFIX,
  REDIS_NOT_FOUND_MARKER,
  REDIS_INSTRUMENTAL_MARKER,
  LOCK_TTL,
  LOCK_TTL_MS,
} from "@/constants";
export const NOT_FOUND = {
  status: "error",
  error: { code: "NOT_FOUND", message: "Lyrics not found" },
} as const satisfies LyricsResponse;
export const INSTRUMENTAL = {
  status: "success",
  data: { type: "instrumental" },
} as const satisfies LyricsResponse;

const memoryCache = new LRUCache<string, LyricsResponse>({
  max: 100,
  ttl: 1000 * 60 * 5,
  ttlAutopurge: true,
});

const inFlight = new Map<string, Promise<unknown>>();

const waitlist = new EventEmitter() as WaitlistEmitter;
waitlist.setMaxListeners(0);

let connecting: Promise<void> | null = null;

async function ensureRedisConnected(): Promise<void> {
  if (redis.connected) return;
  if (!connecting) {
    connecting = redis.connect().finally(() => {
      connecting = null;
    });
  }
  await connecting;
}

const subscriber = await redis.duplicate();
try {
  await subscriber.connect();
  await subscriber.subscribe(LYRICS_CHANNEL, (message: string) => {
    try {
      waitlist.emit(message);
    } catch (err) {
      logger.error(err, "Waitlist emit failed");
    }
  });
} catch (err) {
  logger.warn({ err }, "PubSub setup failed");
}

export const getLyricsFromCache = async (id: string): Promise<LyricsResponse | null> => {
  const local = memoryCache.get(id);
  if (local) return local;

  const REDIS_KEY = `${SPOTIFY_CACHE_PREFIX}${id}`;
  try {
    const cached = await redis.get(REDIS_KEY);
    if (!cached) return null;

    if (cached === REDIS_NOT_FOUND_MARKER) {
      memoryCache.set(id, NOT_FOUND);
      return NOT_FOUND;
    }

    if (cached === REDIS_INSTRUMENTAL_MARKER) {
      memoryCache.set(id, INSTRUMENTAL);
      return INSTRUMENTAL;
    }

    try {
      const parsed = JSON.parse(cached);
      const response: LyricsResponse = {
        status: "success",
        data: { ...parsed, type: "lyrics" },
      } as LyricsResponse;

      memoryCache.set(id, response);
      return response;
    } catch (err) {
      logger.error({ id, err }, "failed to JSON.parse lyrics from redis");
      return null;
    }
  } catch (err) {
    logger.error({ id, err }, "failed to get lyrics from redis");
    return null;
  }
};

export const withSingleFlight = <T>(id: string, fn: () => Promise<T>): Promise<T> => {
  const running = inFlight.get(id);
  if (running) return running as Promise<T>;

  const promise = fn().finally(() => {
    inFlight.delete(id);
  });
  inFlight.set(id, promise);
  return promise;
};

export const waitForWakeup = (id: string, timeoutMs = LOCK_TTL_MS): Promise<void> => {
  return new Promise((resolve) => {
    let timer: NodeJS.Timeout;

    const cleanup = () => {
      clearTimeout(timer);
      waitlist.off(id, handler);
    };

    const handler = () => {
      cleanup();
      resolve();
    };

    waitlist.once(id, handler);

    timer = setTimeout(() => {
      cleanup();
      resolve();
    }, timeoutMs);
  });
};

export async function withLock<T>(
  id: string,
  onAcquire: () => Promise<T>,
  onWait: () => Promise<T>,
  waitTimeoutMs = 1000,
): Promise<T> {
  await ensureRedisConnected();

  const lock = `lyrics:lock:${id}`;
  const lockId = crypto.randomUUID();

  const acquiredLock = await redis.send("SET", [lock, lockId, "EX", LOCK_TTL, "NX"]);

  if (!acquiredLock) {
    const wakeupPromise = waitForWakeup(id, waitTimeoutMs);

    const cached = await getLyricsFromCache(id);
    if (cached) return cached as T;

    await wakeupPromise;
    return await onWait();
  }

  try {
    return await onAcquire();
  } finally {
    const releaseScript = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end`;

    try {
      await redis.send("EVAL", [releaseScript, "1", lock, lockId]);
    } catch (err) {
      logger.error({ id, err }, "failed to delete lock");
    }

    try {
      await redis.publish(LYRICS_CHANNEL, id);
    } catch (err) {
      logger.error({ id, err }, "failed to publish wakeup");
    }
  }
}

export const setRedisCache = async (id: string, ttl: number, value: string) => {
  const REDIS_KEY = `${SPOTIFY_CACHE_PREFIX}${id}`;

  if (value === REDIS_NOT_FOUND_MARKER) {
    memoryCache.set(id, NOT_FOUND);
  } else if (value === REDIS_INSTRUMENTAL_MARKER) {
    memoryCache.set(id, INSTRUMENTAL);
  } else {
    try {
      memoryCache.set(id, { status: "success", data: { ...JSON.parse(value), type: "lyrics" } });
    } catch (err) {
      logger.error({ id, err }, "failed to parse payload for L1 memory cache");
    }
  }

  try {
    await redis.setex(REDIS_KEY, ttl, value);
  } catch (err) {
    logger.error({ id, err }, "failed to set cache to redis");
  }
};

export const clearTrackCache = async (id: string) => {
  memoryCache.delete(id);
  try {
    await redis.del(`${SPOTIFY_CACHE_PREFIX}${id}`);
  } catch (err) {
    logger.error({ id, err }, "Failed to clear cache from Redis");
  }
};

export const clearLinkedTrackCache = async (extraKeys: string[]) => {
  for (const k of extraKeys) {
    memoryCache.delete(k);
  }
  try {
    const keys = extraKeys.map((k) => `${SPOTIFY_CACHE_PREFIX}${k}`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    logger.error({ keys: extraKeys, err }, "Failed to clear linked cache");
  }
};
