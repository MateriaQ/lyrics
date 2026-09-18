import env from "@/env";
import { logger } from "@/logger";
import { HTTP_CODES } from "@/lib/http";
import { API_ERRORS } from "@/utils/app";
import { calculateLyricsScore } from "@/lib/lyrics";

import {
  getLyricsFromCache,
  withLock,
  withSingleFlight,
  waitForWakeup,
  NOT_FOUND,
  INSTRUMENTAL,
  setRedisCache,
  clearTrackCache,
  clearLinkedTrackCache,
} from "@/lib/lyrics/cache";
import {
  REDIS_NOT_FOUND_MARKER,
  REDIS_INSTRUMENTAL_MARKER,
  REVALIDATION_COOLDOWN_MS,
  THIRTY_DAYS_MS,
} from "@/constants";
import {
  fetchTrackRecordFromDb,
  flagTrackForRevalidation,
  setTrackInstrumental,
  type TrackRecord,
} from "@/lib/lyrics/db";
import { fetchAndStoreLyrics } from "@/lib/lyrics/fetch";
import type { LyricsResponse } from "@/lib/lyrics/types";
import type { Lyrics } from "@/lib/lyrics/schema";

const mapCacheResult = (cached: LyricsResponse) => {
  if (cached.status === "success") return { code: HTTP_CODES.OK, response: cached };
  if (cached.error.code === "NOT_FOUND") return { code: HTTP_CODES.NOT_FOUND, response: NOT_FOUND };
  return { code: HTTP_CODES.INTERNAL_SERVER_ERROR, response: API_ERRORS.SERVER_ERROR };
};

const serveFromDatabase = async (
  id: string,
  trackRecord: TrackRecord | null,
): Promise<LyricsResponse | null> => {
  if (!trackRecord) return null;

  if (trackRecord.instrumental) {
    logger.debug({ id }, "Track is instrumental, skipping fetch");
    await setRedisCache(id, env.LYRICS_CACHE_TTL, REDIS_INSTRUMENTAL_MARKER);
    return INSTRUMENTAL;
  }

  const lastRevalidated = trackRecord.revalidatedAt
    ? new Date(trackRecord.revalidatedAt).getTime()
    : 0;
  const isCooldownActive = Date.now() - lastRevalidated < REVALIDATION_COOLDOWN_MS;

  let NOT_FOUND_TTL = env.LYRICS_NOT_FOUND_TTL;
  if (trackRecord.releaseDate) {
    const releaseDate = new Date(trackRecord.releaseDate);
    const time = releaseDate.getTime();
    if (typeof time === "number" && !Number.isNaN(time) && Date.now() - time < THIRTY_DAYS_MS) {
      NOT_FOUND_TTL = env.LYRICS_NEW_NOT_FOUND_TTL;
    }
  }

  const isFreshNotFound =
    !trackRecord.hasLyrics &&
    Date.now() - new Date(trackRecord.updatedAt!).getTime() < NOT_FOUND_TTL * 1000;

  const needsRevalidate = trackRecord.revalidate && !isCooldownActive;
  const needsInitialFetch = !trackRecord.hasLyrics && !isFreshNotFound;

  if (needsRevalidate || needsInitialFetch) return null;

  if (trackRecord.hasLyrics && trackRecord.lyrics.length > 0) {
    let bestDbLyrics: Lyrics | null = null;
    let bestDbScore = -1;

    for (const lyrics of trackRecord.lyrics) {
      const parsedDb = lyrics.parsed;
      const data = parsedDb?.data;
      if (!parsedDb || !data?.lyrics) continue;

      const score = calculateLyricsScore(data.lyrics.type, lyrics.source, parsedDb.isCommunity);

      if (score > bestDbScore) {
        bestDbScore = score;
        bestDbLyrics = data;
      }
    }

    if (bestDbLyrics) {
      const normalized = { ...bestDbLyrics, type: "lyrics" as const };
      await setRedisCache(id, env.LYRICS_CACHE_TTL, JSON.stringify(normalized));
      return { status: "success", data: normalized };
    }
  } else if (!trackRecord.hasLyrics) {
    await setRedisCache(id, NOT_FOUND_TTL, REDIS_NOT_FOUND_MARKER);
    return NOT_FOUND;
  }

  return null;
};

export const getSpotifyLyrics = async (id: string) => {
  try {
    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const cached = await getLyricsFromCache(id);
      if (cached) return mapCacheResult(cached);

      type LockResult =
        | { retry: false; finalRes: LyricsResponse }
        | { retry: true; finalRes: null };

      const result = await withSingleFlight(id, () =>
        withLock<LockResult>(
          id,
          async () => {
            let finalRes: LyricsResponse = NOT_FOUND;

            try {
              const reCached = await getLyricsFromCache(id);
              if (reCached) return { retry: false, finalRes: reCached };

              const trackRecord = await fetchTrackRecordFromDb(id);
              const fromDb = await serveFromDatabase(id, trackRecord);

              if (fromDb) {
                return { retry: false, finalRes: fromDb };
              }

              finalRes = await fetchAndStoreLyrics(id, trackRecord);
            } catch (err) {
              logger.error({ id, err }, "get lyrics task failed");
              finalRes = API_ERRORS.SERVER_ERROR as unknown as LyricsResponse;
            }

            return { retry: false, finalRes };
          },
          async () => {
            logger.debug({ id }, "Waiting for existing worker to finish lyrics fetch");
            await waitForWakeup(id);
            return { retry: true, finalRes: null };
          },
        ),
      );

      if (result.retry) continue;

      const finalRes = result.finalRes;
      if (finalRes.status === "error") {
        if (finalRes.error.code === "SERVER_ERROR") {
          return { code: HTTP_CODES.INTERNAL_SERVER_ERROR, response: API_ERRORS.SERVER_ERROR };
        }
        return { code: HTTP_CODES.NOT_FOUND, response: NOT_FOUND };
      }
      return { code: HTTP_CODES.OK, response: finalRes };
    }

    return { code: HTTP_CODES.INTERNAL_SERVER_ERROR, response: API_ERRORS.SERVER_ERROR };
  } catch (err) {
    logger.error({ id, err }, "Internal router error");
    return { code: HTTP_CODES.INTERNAL_SERVER_ERROR, response: API_ERRORS.SERVER_ERROR };
  }
};

export const revalidateSpotifyLyrics = async (id: string, forceValidate: boolean) => {
  try {
    await clearTrackCache(id);
    const updatedTrack = await flagTrackForRevalidation(id);

    if (updatedTrack) {
      const extraKeys = updatedTrack.spotifyIds.filter((sid) => sid !== id);
      await clearLinkedTrackCache(extraKeys);
    } else {
      logger.debug({ id }, "Track not found in database");
    }

    logger.info(
      {
        id,
        isrc: updatedTrack?.isrc,
        linkedIds: updatedTrack?.spotifyIds ?? [],
        force: forceValidate,
      },
      "Track lyrics flagged for revalidation",
    );

    const result = await withLock(
      id,
      async () => {
        try {
          const trackRecord = await fetchTrackRecordFromDb(id);

          if (trackRecord?.instrumental && !forceValidate) {
            logger.info({ id }, "Revalidation skipped: track is flagged as instrumental");
            return { type: "instrumental_error" as const };
          } else {
            if (trackRecord?.instrumental && forceValidate) {
              logger.info({ id }, "Force revalidating track previously flagged as instrumental");
            }
            await fetchAndStoreLyrics(id, trackRecord);
            return { type: "success" as const };
          }
        } catch (err) {
          logger.error({ id, err }, "Revalidation fetch failed");
          return { type: "server_error" as const };
        }
      },
      async () => {
        logger.debug({ id }, "Revalidation skipped: another worker is already fetching?");
        return { type: "success" as const };
      },
    );

    if (result.type === "instrumental_error") {
      return {
        code: HTTP_CODES.UNPROCESSABLE_ENTITY,
        response: {
          status: "error",
          error: {
            code: "INSTRUMENTAL_SONG",
            message:
              "Revalidation failed: This track is flagged as an instrumental and cannot have lyrics.",
          },
        },
      };
    }

    if (result.type === "server_error") {
      return { code: HTTP_CODES.INTERNAL_SERVER_ERROR, response: API_ERRORS.SERVER_ERROR };
    }

    return { code: HTTP_CODES.OK, response: { status: "success", data: { revalidated: true } } };
  } catch (err) {
    logger.error({ id, err }, "Internal error while processing revalidation");
    return { code: HTTP_CODES.INTERNAL_SERVER_ERROR, response: API_ERRORS.SERVER_ERROR };
  }
};

export const instrumentalSpotifyLyrics = async (id: string, isInstrumental: boolean) => {
  try {
    await clearTrackCache(id);

    let trackRecord = await fetchTrackRecordFromDb(id);

    const shouldFetch = !trackRecord || (!isInstrumental && !trackRecord.hasLyrics);

    if (shouldFetch) {
      logger.info(
        { id, trackExists: !!trackRecord, isInstrumental },
        "Track missing from DB or has no lyrics, fetching data before updating instrumental status",
      );

      await withLock(
        id,
        async () => {
          try {
            await fetchAndStoreLyrics(id, trackRecord);
          } catch (err) {
            logger.error({ id, err }, "Failed to fetch and store track data");
          }
        },
        async () => {
          logger.debug(
            { id },
            "Waiting for existing worker to finish lyrics fetch before flagging",
          );
          await waitForWakeup(id);
        },
      );
    }

    const updatedTrack = await setTrackInstrumental(id, isInstrumental);

    if (!updatedTrack) {
      return {
        code: HTTP_CODES.NOT_FOUND,
        response: {
          status: "error",
          error: { code: "NOT_FOUND", message: "Track not found in database" },
        },
      };
    }

    if (isInstrumental) {
      const extraKeys = updatedTrack.spotifyIds.filter((sid) => sid !== id);
      await clearLinkedTrackCache(extraKeys);
    }

    logger.info({ id, instrumental: isInstrumental }, "Successfully updated instrumental status");

    return {
      code: HTTP_CODES.OK,
      response: { status: "success", data: { instrumental: isInstrumental } },
    };
  } catch (err) {
    logger.error({ id, err }, "Internal error while updating instrumental status");
    return { code: HTTP_CODES.INTERNAL_SERVER_ERROR, response: API_ERRORS.SERVER_ERROR };
  }
};
