import env from "@/env";
import { logger } from "@/logger";
import { PROVIDERS_INFO } from "@/provider";
import { getAppleLyrics } from "@/lib/apple/getLyrics";
import { getAppleFromSpotify } from "@/lib/bridge/matcher";
import { fetchSpicy, lyricsPacker, parseSpicy } from "@/lib/spicy";
import { getTrackData } from "@/lib/spotify";
import { getMusixmatchLyrics, parseMusixmatchLyrics } from "@/lib/musixmatch/getLyrics";
import { parse } from "@/lib/ttml/parser";
import { romanizeLyrics } from "@/lib/lyrics/romanize";
import { calculateLyricsScore } from "@/lib/lyrics";

import { saveLyricsTransaction, type TrackRecord } from "@/lib/lyrics/db";
import { setRedisCache, NOT_FOUND, INSTRUMENTAL } from "@/lib/lyrics/cache";
import { REDIS_NOT_FOUND_MARKER, REDIS_INSTRUMENTAL_MARKER } from "@/constants";

import type {
  FetchResult,
  LyricsResponse,
  APIResponse,
  LyricsData,
  RomanizedAPIResponse,
  MusixmatchTaskResult,
} from "@/lib/lyrics/types";
import type { AMTrackData as MatcherTrackData } from "@/lib/bridge/matcher";
import type { TrackData } from "@/lib/lyrics/types";
import type { SpicyQuery, Lyrics as SpicyLyrics } from "@/lib/spicy/types";
import type { Provider } from "@/db/schema/lyrics";
import type { Lyrics } from "@/lib/lyrics/schema";

export async function fetchAndStoreLyrics(
  id: string,
  trackRecord: TrackRecord | null,
): Promise<LyricsResponse> {
  let finalRes: LyricsResponse = NOT_FOUND;

  const track = await getTrackData(id);
  if (!track) {
    logger.warn({ id }, "failed to get track data from spotify");
    await setRedisCache(id, env.LYRICS_NOT_FOUND_TTL, REDIS_NOT_FOUND_MARKER);
    return finalRes;
  }

  const [spicyResult, musixmatchResult, appleAPIResult] = await Promise.all([
    fetchSpicyTask(id),
    fetchMusixmatchTask(id, track),
    getAppleFromSpotify(track)
      .then(async (matchData) => {
        const lyricsRes = await fetchAppleTask(id, matchData);
        return { matchData, lyricsRes };
      })
      .catch(() => ({
        matchData: null,
        lyricsRes: {
          provider: "apple",
          status: "error",
          reason: "MATCHER_FAILED",
        } satisfies FetchResult,
      })),
  ]);

  const { matchData, lyricsRes: appleResult } = appleAPIResult;

  const allCandidates: LyricsData[] = [];
  const apiResults: APIResponse[] = [];
  let hasApiErrors = false;

  for (const task of [spicyResult, musixmatchResult, appleResult]) {
    if (task.status === "success" && task.data) {
      apiResults.push(task.data);
    } else if (task.status === "error") {
      hasApiErrors = true;

      const dbFallback = trackRecord?.lyrics.find((l) => l.source === task.provider);
      if (dbFallback && dbFallback.parsed) {
        logger.debug({ id, provider: task.provider }, "API failed, using DB fallback");

        const parsed = dbFallback.parsed;

        allCandidates.push({
          provider: task.provider,
          parsed: parsed.data,
          isCommunity: task.provider === "spicy" ? (parsed.isCommunity ?? false) : undefined,
        });
      }
    }
  }

  const tasks: Promise<RomanizedAPIResponse>[] = [];
  for (const r of apiResults) {
    tasks.push(
      (async (): Promise<RomanizedAPIResponse> => {
        const romanized = await romanizeLyrics(r.parsed);
        return {
          ...r,
          parsed: romanized.payload,
          romanVersion: romanized.version,
          romanSuccess: romanized.success,
        };
      })(),
    );
  }

  const romanRes = await Promise.all(tasks);

  for (const r of romanRes) {
    allCandidates.push({
      provider: r.provider,
      parsed: r.parsed,
      isCommunity: r.provider === "spicy" ? r.isCommunity : undefined,
    });
  }

  if (trackRecord?.lyrics) {
    const dbAmll = trackRecord.lyrics.find((lyric) => lyric.source === "amll");

    if (dbAmll?.parsed) {
      const parsed = dbAmll.parsed;
      allCandidates.push({
        provider: "amll",
        parsed: parsed.data,
      });
    }
  }

  const trackHasLyrics = allCandidates.length > 0;
  let bestResponse: LyricsData | null = null;
  let score = -1;

  if (trackHasLyrics) {
    for (let i = 0; i < allCandidates.length; i++) {
      const candidate = allCandidates[i];
      if (!candidate || !candidate.parsed) continue;

      const iScore = calculateLyricsScore(
        candidate.parsed.lyrics.type,
        candidate.provider,
        candidate.isCommunity,
      );

      if (iScore > score) {
        score = iScore;
        bestResponse = candidate;
      }
    }
  }

  const musixmatchIds = musixmatchResult.ids ?? { spotify: [], apple: [] };
  const extraAppleIdMatches = matchData?.appleIds ?? [];

  const instrumental = musixmatchResult.instrumental ?? false;

  // TODO: improve matcher
  const extraSpotifyIds = musixmatchIds.spotify;
  const extraAppleIds = [...musixmatchIds.apple, ...extraAppleIdMatches];

  await saveLyricsTransaction({
    id,
    track,
    trackHasLyrics,
    hasApiErrors,
    matchData,
    romanRes,
    bestResponse,
    extraSpotifyIds,
    extraAppleIds,
    instrumental,
  });

  if (instrumental) {
    logger.info({ id }, "Track detected as instrumental");

    await setRedisCache(id, env.LYRICS_CACHE_TTL, REDIS_INSTRUMENTAL_MARKER);
    finalRes = INSTRUMENTAL;
  } else if (!bestResponse || !bestResponse.parsed) {
    logger.debug({ id }, "no provider have lyrics");

    let notFoundTtl = env.LYRICS_NOT_FOUND_TTL;
    if (track && "releaseDate" in track && track.releaseDate) {
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      const time = track.releaseDate.getTime();
      if (typeof time === "number" && !Number.isNaN(time)) {
        const ageMs = Date.now() - time;
        if (ageMs < thirtyDaysInMs) {
          notFoundTtl = env.LYRICS_NEW_NOT_FOUND_TTL;
        }
      }
    }

    await setRedisCache(id, notFoundTtl, REDIS_NOT_FOUND_MARKER);
    finalRes = NOT_FOUND;
  } else {
    logger.info(
      { id, provider: bestResponse.provider, type: bestResponse.parsed.lyrics.type },
      "Lyrics resolved successfully",
    );

    await setRedisCache(id, env.LYRICS_CACHE_TTL, JSON.stringify(bestResponse.parsed));

    finalRes = {
      status: "success",
      data: bestResponse.parsed,
    };
  }

  return finalRes;
}

async function fetchSpicyTask(id: string, spotifyToken?: string): Promise<FetchResult> {
  const provider: Provider = "spicy";
  const ctx = { id, provider };

  try {
    const res = await fetchSpicy(id, spotifyToken);
    const query = res?.queries?.find(
      (q): q is Extract<SpicyQuery, { operation: "lyrics" }> =>
        "operation" in q && q.operation === "lyrics",
    );

    if (
      query?.result.httpStatus !== 200 ||
      ("error" in query.result && query?.result?.error === "MISSING_LYRICS")
    ) {
      logger.debug(ctx, "Lyrics not found");
      return { provider, status: "not_found" };
    }

    const lyrics = lyricsPacker.unpack(query.result.data) as SpicyLyrics | undefined | null | "";

    if (lyrics == null || lyrics === "") {
      return { provider, status: "not_found" };
    }
    const parsedLyrics = parseSpicy(lyrics);
    if (!parsedLyrics) {
      logger.warn(ctx, "Failed to parse lyrics");
      return { provider, status: "error", reason: "PARSE_FAILED" };
    }
    const isCommunity = lyrics?.source === "spl";
    lyrics.isCommunity = isCommunity;

    const parsed: Lyrics = {
      type: "lyrics",
      lyrics: parsedLyrics.lyrics,
      meta: parsedLyrics.meta,
      provider: PROVIDERS_INFO["spicy"],
    };

    return {
      provider,
      status: "success",
      data: {
        provider: "spicy",
        isCommunity,
        raw: lyrics,
        parsed,
      },
    };
  } catch (err) {
    logger.error({ ...ctx, err }, "Spicy Fetch failed");
    return { provider, status: "error", reason: "FETCH_FAILED" };
  }
}

async function fetchAppleTask(
  id: string,
  matchData: MatcherTrackData | null,
): Promise<FetchResult> {
  const provider: Provider = "apple";
  const ctx = { id, provider };
  try {
    if (!matchData) {
      logger.debug(ctx, "No Apple match found");
      return { provider, status: "not_found" };
    }

    if (!matchData.hasLyrics) {
      logger.debug(ctx, "Track has no lyrics");
      return { provider, status: "not_found" };
    }

    const res = await getAppleLyrics(matchData.appleId);
    const ttml = res?.data?.[0]?.attributes?.ttml || res?.data?.[0]?.attributes?.ttmlLocalizations;
    if (!ttml) {
      logger.warn({ ...ctx, appleId: matchData.appleId }, "TTML missing");
      return { provider, status: "not_found" };
    }

    const parsed = parse(ttml);

    if (!parsed.success) {
      logger.error({ ...ctx, err: parsed.error }, "TTML parse failed");
      return { provider, status: "error", reason: "TTML_PARSE_FAILED" };
    }

    return {
      provider,
      status: "success",
      data: {
        provider: "apple",
        raw: ttml,
        parsed: {
          type: "lyrics",
          lyrics: parsed.data,
          meta: parsed.meta,
          provider: PROVIDERS_INFO["apple"],
        },
      },
    };
  } catch (err) {
    logger.error({ ...ctx, err }, "Apple Fetch failed");
    return { provider, status: "error", reason: "FETCH_FAILED" };
  }
}

async function fetchMusixmatchTask(
  id: string,
  track: TrackData | null,
): Promise<MusixmatchTaskResult> {
  const provider: Provider = "musixmatch";
  const ctx = { id, provider };

  try {
    if (!track?.isrc) {
      logger.debug(ctx, "Track has no ISRC");
      return { provider, status: "not_found" };
    }

    const res = await getMusixmatchLyrics(track.isrc);

    if (!res.success) {
      if (res.code === "NOT_FOUND") {
        return { provider, status: "not_found" };
      }
      if (res.code === "RATE_LIMITED") {
        logger.warn(ctx, res.message);
      } else if (res.code === "AUTH_FAILED") {
        logger.error(ctx, res.message);
      } else {
        logger.debug(ctx, res.message);
      }
      return { provider, status: "error", reason: res.code };
    }

    const { lyrics: lyricsBody, ids, instrumental } = res.data;

    if (!lyricsBody) {
      logger.debug(ctx, "No lyrics returned from musixmatch");
      return { provider, status: "not_found", ids, instrumental };
    }

    const lyrics = parseMusixmatchLyrics(lyricsBody, track.duration);
    if (!lyrics || !lyrics.lyrics) {
      logger.warn(ctx, "Failed to parse lyrics");
      return { provider, status: "error", reason: "PARSE_FAILED", ids, instrumental };
    }

    return {
      provider,
      status: "success",
      ids,
      instrumental,
      data: {
        provider: "musixmatch",
        raw: lyricsBody,
        parsed: {
          type: "lyrics",
          lyrics: lyrics.lyrics,
          meta: lyrics.meta,
          provider: PROVIDERS_INFO["musixmatch"],
        },
      },
    };
  } catch (err) {
    logger.error({ ...ctx, err }, "Musixmatch Fetch failed");
    return { provider, status: "error", reason: "FETCH_FAILED" };
  }
}
