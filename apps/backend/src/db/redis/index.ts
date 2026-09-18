import env from "@/env";
import { RedisClient } from "bun";
import { logger } from "@/logger";

export const redis = new RedisClient(env.VALKEY_URL, {
  enableAutoPipelining: true,
  autoReconnect: true,
  // maxRetries: 10,
  enableOfflineQueue: false,
});

export async function checkRedis() {
  try {
    if (!redis.connected) {
      await redis.connect();
    }
    const status = await redis.ping();
    if (status !== "PONG") throw new Error("Unexpected Redis response");
  } catch (err) {
    logger.error(err, "Redis Health Check Failed");
    throw new Error("Failed to connect to Redis", { cause: err });
  }
}

export default redis;
