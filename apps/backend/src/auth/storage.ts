import { redis } from "@/db/redis";

import type { SecondaryStorage } from "better-auth";

const keyPrefix = "auth:";
const prefixKey = (key: string): string => {
  return `${keyPrefix}${key}`;
};
export const redisSecondaryStorage: SecondaryStorage = {
  get: async (key) => await redis.get(prefixKey(key)),
  getAndDelete: async (key) => await redis.getdel(prefixKey(key)),
  set: async (key, value, ttl) => {
    const prefixedKey = prefixKey(key);
    if (ttl) await redis.setex(prefixedKey, ttl, value);
    else await redis.set(prefixedKey, value);
  },
  delete: async (key) => {
    await redis.del(prefixKey(key));
  },
} satisfies SecondaryStorage;
