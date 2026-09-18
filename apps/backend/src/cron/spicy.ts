import { logger } from "@/logger";
import { Patterns, type CronConfig } from "@elysia/cron";
import { updateSpicyClientVer } from "@/lib/spicy";

export const updateSpicyVersion = {
  name: "update-spicy-version",
  pattern: Patterns.EVERY_HOUR,
  async run() {
    try {
      await updateSpicyClientVer();
    } catch (err) {
      logger.error(err, "Failed to update Spicy client version");
    }
  },
} satisfies CronConfig;
