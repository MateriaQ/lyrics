import env from "@/env";
import { getValidToken } from "@/lib/spotify/auth";
import { getAccessToken } from "@/lib/spotify/getAccessToken";
import type { SpotifyResult, SPTrack, Track } from "@/lib/spotify/types";
import { logger } from "@/logger";
import { HTTP_CODES } from "@/lib/http";

const SPCLIENT_METADATA_URL = "https://spclient.wg.spotify.com/metadata/4/track/";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";

const BASE62_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export type SpotifyTrackData = {
  id: string;
  isrc?: string | undefined;
  name: string;
  artists: string[];
  duration: number;
  albumName: string;
  spotifyImageUrl?: string | undefined;
  releaseDate: Date | null;
  releaseDatePrecision: string;
};

export async function getTrackData(id: string): Promise<SpotifyTrackData | null> {
  try {
    const track = await getTrackSpClient(id);
    let useFallback = !track.success;

    if (track.success) {
      const data = track.data;
      const isrc = data.external_id?.find((v) => v.type === "isrc")?.id;
      const name = data.name;
      const artists = data.artist?.map((v) => v.name) || [];

      if (!isrc || !name || artists.length === 0) {
        logger.info(
          { id, hasIsrc: !!isrc, hasName: !!name },
          "SpClient missing required metadata, falling back to Official Web API",
        );
        useFallback = true;
      } else {
        const fileId = data.album?.cover_group?.image?.[0]?.file_id;

        let releaseDate: Date | null = null;
        let releaseDatePrecision = "";
        const dateMeta = data.album?.date;

        if (dateMeta?.year) {
          const year = dateMeta.year;
          const month = dateMeta.month || 1;
          const day = dateMeta.day || 1;

          releaseDate = new Date(Date.UTC(year, month - 1, day));

          if (dateMeta.day) {
            releaseDatePrecision = "day";
          } else if (dateMeta.month) {
            releaseDatePrecision = "month";
          } else {
            releaseDatePrecision = "year";
          }
        }

        return {
          id,
          isrc,
          name,
          artists,
          duration: data.duration,
          albumName: data.album?.name,
          spotifyImageUrl: fileId ? `https://i.scdn.co/image/${fileId}` : undefined,
          releaseDate,
          releaseDatePrecision,
        };
      }
    }

    if (useFallback) {
      if (!track.success) {
        logger.info(
          { id, code: track.code, message: track.message },
          "SpClient failed, falling back to Official Web API",
        );
      }

      try {
        const data = await getTrack(id);
        const isrc = data.external_ids?.isrc;
        const name = data.name;
        const artists = data.artists?.map((v) => v.name) || [];

        if (!isrc || !name || artists.length === 0) {
          logger.info(
            { id, hasIsrc: !!isrc, hasName: !!name },
            "Official Web API also missing metadata.",
          );
          return null;
        }

        let releaseDate: Date | null = null;
        if (data.album?.release_date) {
          const parts = data.album.release_date.split("-").map(Number);
          const [y = 1970, m = 1, d = 1] = parts;
          releaseDate = new Date(Date.UTC(y, m - 1, d));
        }

        return {
          id,
          isrc,
          name,
          artists,
          duration: data.duration_ms,
          albumName: data.album?.name,
          spotifyImageUrl: data.album?.images?.[0]?.url,
          releaseDate,
          releaseDatePrecision: data.album.release_date_precision || "",
        };
      } catch (err) {
        logger.error({ id, err }, "Official Web API fallback also failed");
        return null;
      }
    }

    return null;
  } catch (err) {
    logger.error(err, "failed to getTrackData from spotify");
    return null;
  }
}

function spotifyIdToGid(id: string): string {
  let value = 0n;
  for (let i = 0; i < id.length; i++) {
    const charIndex = BASE62_ALPHABET.indexOf(id[i]);
    if (charIndex === -1) throw new Error(`Invalid Spotify ID character: ${id[i]}`);
    value = value * 62n + BigInt(charIndex);
  }
  return value.toString(16).padStart(32, "0");
}

// function gidToSpotifyId(gid: string): string {
//   let value = BigInt("0x" + gid);
//   let id = "";
//   while (value > 0n) {
//     id = BASE62_ALPHABET[Number(value % 62n)] + id;
//     value /= 62n;
//   }
//   return id.padStart(22, "0");
// }

async function getTrackSpClient(
  id: string,
  token?: string | null,
): Promise<SpotifyResult<SPTrack>> {
  if (!token) {
    const res = await getValidToken(env.SP_DC);
    if (!res.success) {
      logger.debug({ id }, "Failed to get valid auth token");
      return res;
    }
    if (res.data) token = res.data.token;
  }

  const gid = spotifyIdToGid(id);
  const url = `${SPCLIENT_METADATA_URL}${gid}?market=from_token`;

  try {
    // fallow-ignore-next-line security-sink -- hostname is constant spclient.wg.spotify.com
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "App-Platform": "WebPlayer",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        // "spotify-app-version": "1.2.89.402.gde3ac00d",
      },
      signal: AbortSignal.timeout(env.FETCH_TIMEOUT),
    });

    if (response.status === HTTP_CODES.NOT_FOUND) {
      return {
        success: false,
        message: "Track metadata was not found.",
        code: "NOT_FOUND",
      };
    }

    if (response.status === HTTP_CODES.TOO_MANY_REQUESTS) {
      return {
        success: false,
        message: "Rate limited by Spotify. Please try again later.",
        code: "RATE_LIMITED",
      };
    }

    if (response.status === HTTP_CODES.UNAUTHORIZED || response.status === HTTP_CODES.FORBIDDEN) {
      return {
        success: false,
        message: "Spotify token is invalid or expired.",
        code: "AUTH_FAILED",
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message: `Spotify internal API error: ${response.statusText}`,
        code: "API_ERROR",
      };
    }

    const data = (await response.json()) as SPTrack;
    return { success: true, data };
  } catch (err) {
    logger.error(err, "Error in getTrackSpClient");
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
      code: "INTERNAL_ERROR",
    };
  }
}

async function getTrack(id: string): Promise<Track> {
  const token = await getAccessToken();

  // fallow-ignore-next-line security-sink -- hostname is constant api.spotify.com
  const res = await fetch(`${SPOTIFY_API_URL}/tracks/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(env.FETCH_TIMEOUT),
  });

  if (!res.ok) {
    logger.debug({ id, status: res.status }, "Web API fetch failed");
    throw new Error(`Spotify API Error: ${res.status} ${res.statusText}`, { cause: res });
  }

  return (await res.json()) as Track;
}
