import env from "@/env";
import { logger } from "@/logger";
import { sendAdminAlert } from "@/emails";
import { validateSpDcToken } from "@/lib/spotify/auth";
import { checkAppleTokenExpiry } from "@/lib/apple/check";
import { Patterns, type CronConfig } from "@elysia/cron";

export const appleTokenCron = {
  name: "check-apple-token-expiry",
  pattern: Patterns.EVERY_DAY_AT_MIDNIGHT,
  async run() {
    await checkAppleTokenExpiry(true);
  },
} satisfies CronConfig;

export const checkSpDcToken = {
  name: "check-sp-dc-token-validity",
  pattern: Patterns.EVERY_DAY_AT_MIDNIGHT,
  async run() {
    try {
      if (!env.SP_DC) {
        logger.warn("SPOTIFY_SP_DC environment variable is missing");
        return;
      }

      const isValid = await validateSpDcToken(env.SP_DC);
      if (isValid) return;

      logger.warn("Spotify sp_dc token is invalid or expired");

      await sendAdminAlert({
        subject: "Action Required: Spotify sp_dc token expired",
        message:
          "The Spotify sp_dc cookie is no longer valid. Web APIs relying on this token will fail.\n\nPlease extract a fresh sp_dc cookie from an incognito browser session and update the SPOTIFY_SP_DC environment variable to restore service.",
      });
    } catch (err) {
      logger.error(err, "Failed to run sp_dc token validity check cron");
    }
  },
} satisfies CronConfig;
