import env from "@/env";
import { HTTP_CODES } from "@/lib/http";
import { parseLrcLyrics } from "@/lib/lrc/parser";
import type { LineData, LyricsMetadata, StaticData } from "@/lib/lyrics/schema";
import type { MusixmatchResult } from "@/lib/musixmatch/types";

const MUSIXMATCH_BASE = "https://apic-appmobile.musixmatch.com/ws/1.1/";
const MUSIXMATCH_APP_ID = "mac-ios-v2.0";

const MUSIXMATCH_HEADERS: Record<string, string> = {
  Host: "apic-appmobile.musixmatch.com",
  authority: "apic-appmobile.musixmatch.com",
  "x-mxm-app-version": "10.1.1",
  "X-User-Agent": "Musixmatch/2025120901 CFNetwork/3860.300.31 Darwin/25.2.0",
  "Accept-Language": "en-US,en;q=0.9",
  Connection: "keep-alive",
  Accept: "application/json",
};

type MusixmatchHeader = {
  status_code?: number;
};

type MusixmatchTokenResponse = {
  message?: {
    header?: MusixmatchHeader;
    body?: {
      user_token?: string;
    };
  };
};

type MusixmatchTrack = {
  track_spotify_id?: string;
  commontrack_spotify_ids?: string[];
  commontrack_itunes_ids?: (number | string)[];
  instrumental?: number;
};

type MusixmatchSubtitleResponse = {
  message?: {
    header?: MusixmatchHeader;
    body?: {
      macro_calls?: {
        "track.subtitles.get"?: {
          message?: {
            header?: MusixmatchHeader;
            body?: {
              subtitle_list?: Array<{
                subtitle?: {
                  subtitle_body?: string;
                  instrumental?: number;
                };
              }>;
            };
          };
        };
        "matcher.track.get"?: {
          message?: {
            header?: MusixmatchHeader;
            body?: {
              track?: MusixmatchTrack;
            };
          };
        };
        "track.get"?: {
          message?: {
            header?: MusixmatchHeader;
            body?: {
              track?: MusixmatchTrack;
            };
          };
        };
      };
    };
  };
};

export type MusixmatchLyricsData = {
  lyrics?: string;
  ids: { spotify: string[]; apple: string[] };
  instrumental: boolean;
};

let cachedUserToken: string | null = null;
let pendingTokenPromise: Promise<MusixmatchResult<string>> | null = null;

async function getMusixmatchToken(forceRefresh = false): Promise<MusixmatchResult<string>> {
  if (!forceRefresh && cachedUserToken) {
    return { success: true, data: cachedUserToken };
  }

  if (pendingTokenPromise) {
    return pendingTokenPromise;
  }

  pendingTokenPromise = (async (): Promise<MusixmatchResult<string>> => {
    const url = `${MUSIXMATCH_BASE}token.get?app_id=${MUSIXMATCH_APP_ID}`;

    try {
      // fallow-ignore-next-line security-sink -- hostname is constant apic-appmobile.musixmatch.com
      const response = await fetch(url, {
        method: "GET",
        headers: MUSIXMATCH_HEADERS,
        signal: AbortSignal.timeout(env.FETCH_TIMEOUT),
      });

      if (!response.ok) {
        return {
          success: false,
          code: "API_ERROR",
          message: `Musixmatch token error: ${response.statusText}`,
        };
      }

      const data = (await response.json()) as MusixmatchTokenResponse;
      const token = data.message?.body?.user_token;

      if (!token) {
        return {
          success: false,
          code: "AUTH_FAILED",
          message: "Musixmatch returned an empty token response.",
        };
      }

      cachedUserToken = token;
      return { success: true, data: token };
    } catch (error) {
      return {
        success: false,
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : String(error),
      };
    }
  })();

  try {
    return await pendingTokenPromise;
  } finally {
    pendingTokenPromise = null;
  }
}

export async function getMusixmatchLyrics(
  isrc: string,
): Promise<MusixmatchResult<MusixmatchLyricsData>> {
  let tokenResult = await getMusixmatchToken();
  if (!tokenResult.success) return tokenResult;

  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const url = `${MUSIXMATCH_BASE}macro.subtitles.get?track_isrc=${encodeURIComponent(isrc)}&usertoken=${encodeURIComponent(tokenResult.data)}&app_id=${MUSIXMATCH_APP_ID}`;

    try {
      // fallow-ignore-next-line security-sink -- hostname is constant apic-appmobile.musixmatch.com
      const response = await fetch(url, {
        method: "GET",
        headers: MUSIXMATCH_HEADERS,
        signal: AbortSignal.timeout(env.FETCH_TIMEOUT),
      });

      const isAuthHttpError =
        response.status === HTTP_CODES.UNAUTHORIZED || response.status === HTTP_CODES.FORBIDDEN;

      if (isAuthHttpError && attempt < maxAttempts) {
        cachedUserToken = null;
        tokenResult = await getMusixmatchToken(true);
        if (!tokenResult.success) return tokenResult;
        continue;
      }

      if (response.status === HTTP_CODES.NOT_FOUND) {
        return {
          success: false,
          code: "NOT_FOUND",
          message: "Lyrics for this track were not found.",
        };
      }

      if (response.status === HTTP_CODES.TOO_MANY_REQUESTS) {
        return {
          success: false,
          code: "RATE_LIMITED",
          message: "Rate limited by Musixmatch. Please try again later.",
        };
      }

      if (isAuthHttpError) {
        return {
          success: false,
          code: "AUTH_FAILED",
          message: "Musixmatch token is invalid or expired.",
        };
      }

      if (!response.ok) {
        return {
          success: false,
          code: "API_ERROR",
          message: `Musixmatch API error: ${response.statusText}`,
        };
      }

      const data = (await response.json()) as MusixmatchSubtitleResponse;

      const statusCode = data.message?.header?.status_code;
      const isPayloadAuthError = statusCode === 401 || statusCode === 402 || statusCode === 403;

      if (isPayloadAuthError && attempt < maxAttempts) {
        cachedUserToken = null;
        tokenResult = await getMusixmatchToken(true);
        if (!tokenResult.success) return tokenResult;
        continue;
      }

      if (isPayloadAuthError) {
        return {
          success: false,
          code: "AUTH_FAILED",
          message: "Musixmatch token is invalid or expired.",
        };
      }

      const macro = data.message?.body?.macro_calls;
      const subtitle = macro?.["track.subtitles.get"]?.message?.body?.subtitle_list?.[0]?.subtitle;
      const track =
        macro?.["matcher.track.get"]?.message?.body?.track ??
        macro?.["track.get"]?.message?.body?.track;

      const subtitleBody = subtitle?.subtitle_body;
      const instrumental = Boolean(subtitle?.instrumental || track?.instrumental);

      if (!subtitleBody && !instrumental) {
        return {
          success: false,
          code: "NOT_FOUND",
          message: "Musixmatch returned an empty lyrics response.",
        };
      }

      return {
        success: true,
        data: {
          lyrics: subtitleBody,
          ids: {
            spotify: [
              ...new Set(
                [track?.track_spotify_id, ...(track?.commontrack_spotify_ids ?? [])].filter(
                  (id): id is string => Boolean(id?.trim()),
                ),
              ),
            ],
            apple: [
              ...new Set(
                (track?.commontrack_itunes_ids ?? [])
                  .filter((id) => id != null && String(id).trim() !== "")
                  .map((id) => String(id).trim()),
              ),
            ],
          },
          instrumental,
        },
      };
    } catch (error) {
      return {
        success: false,
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return {
    success: false,
    code: "AUTH_FAILED",
    message: "Musixmatch request failed after token refresh retry.",
  };
}

export type ParsedMusixmatchLyrics = { lyrics: LineData | StaticData; meta: LyricsMetadata };

export function parseMusixmatchLyrics(
  syncedLyrics: string,
  durationMs?: number,
): ParsedMusixmatchLyrics | null {
  const parsed = parseLrcLyrics({
    duration: durationMs !== undefined ? durationMs / 1000 : undefined,
    syncedLyrics,
  });

  if (!parsed) return null;

  return parsed;
}
