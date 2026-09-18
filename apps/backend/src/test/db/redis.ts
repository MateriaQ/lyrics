import { beforeAll, afterAll } from "vitest";
import { redis, checkRedis } from "@/db/redis";

export function setupRedisTestEnv() {
  beforeAll(async () => {
    await checkRedis();
  });

  // beforeEach(async () => {
  //   try {
  //     await redis.send("FLUSHDB", []);
  //   } catch {
  //     // Ignore reconnection errors
  //   }
  // });

  afterAll(async () => {
    try {
      redis.close();
    } catch {
      // Ignore cleanup errors
    }
  });
}
