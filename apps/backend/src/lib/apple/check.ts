import env from "@/env";
import { logger } from "@/logger";

import { getAppleLyrics } from "@/lib/apple/getLyrics";
import { searchTracksISRC } from "@/lib/apple/searchTrack";
import { FIVE_DAYS_S } from "@/constants";
import { sendAdminAlert } from "@/emails";
import { getJwtExpiration } from "@/utils/jwt";
import { isDev } from "@/node-env";

export async function checkAppleTokenExpiry(notifyAdmin: boolean = false): Promise<boolean> {
  try {
    const exp = getJwtExpiration(env.APPLE_AUTH_TOKEN);
    const timeRemainingS = exp - Math.floor(Date.now() / 1000);

    if (isDev) {
      logger.debug(
        `Apple Music Token will expire in ${
          [timeRemainingS / 86400, (timeRemainingS % 86400) / 3600, (timeRemainingS % 3600) / 60]
            .map(Math.floor)
            .map((v, i) => (v > 0 ? `${v}${["d", "h", "m"][i]}` : ""))
            .filter(Boolean)
            .join(" ") || `${Math.max(0, timeRemainingS)}s`
        }`,
      );
    }

    if (timeRemainingS > FIVE_DAYS_S) return true;

    const daysLeft = Math.max(0, Math.ceil(timeRemainingS / 86400));
    const isExpired = daysLeft === 0;
    const expDate = new Date(exp * 1000).toUTCString();

    logger.warn(
      { exp, daysLeft },
      isExpired ? "Apple Music token expired" : `Apple Music token expires in ${daysLeft}d`,
    );

    if (notifyAdmin) {
      await sendAdminAlert({
        subject: isExpired
          ? "Apple Music token has expired"
          : `Apple Music token expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
        message: isExpired
          ? `The Apple Music token expired on ${expDate}.\n\nUpdate APPLE_AUTH_TOKEN in your environment to restore service.`
          : `The Apple Music token will expire on ${expDate} (${daysLeft} days remaining).\n\nRotate and update APPLE_AUTH_TOKEN to prevent downtime.`,
      });
    }

    return !isExpired;
  } catch (err) {
    logger.error(err, "Failed to check Apple Music auth token expiry");
    return false;
  }
}

export async function checkAppleSearch(): Promise<void> {
  const testISRC = "GBARL9300135";

  logger.debug({ testISRC }, "Starting Apple Search service check...");

  try {
    const result = await searchTracksISRC(testISRC);

    if (!result || !result.data || result.data.length === 0) {
      throw new Error("Received empty or null response from Apple Search API.");
    }

    const song = result.data[0];

    if (song.type !== "songs" || !song.attributes) {
      throw new Error("Track fetched but data format is invalid.");
    }

    logger.debug("Apple Search service check passed successfully.");
  } catch (error) {
    throw new Error(
      `Apple Search check failed (Check your Developer & Media User Tokens): ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

export async function checkAppleLyrics(): Promise<void> {
  const testSongId = "1559885421";

  logger.debug({ testSongId }, "Starting Apple Lyrics service check...");

  try {
    const result = await getAppleLyrics(testSongId);

    if (!result || !result.data || result.data.length === 0) {
      throw new Error("Received empty or null response from Apple Lyrics API.");
    }

    const lyricItem = result.data[0];

    if (lyricItem.type !== "syllable-lyrics" || !lyricItem.attributes) {
      throw new Error("Lyrics fetched but data format is invalid.");
    }

    logger.debug("Apple Lyrics service check passed successfully.");
  } catch (error) {
    throw new Error(
      `Apple Lyrics check failed (Check your Developer & Media User Tokens): ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}
