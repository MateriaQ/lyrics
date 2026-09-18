import { logger } from "@/logger";
import { searchTracksISRC, searchSongs, type AppleSong } from "@/lib/apple";
import type { SpotifyTrackData } from "@/lib/spotify";
import { distance } from "fastest-levenshtein";

export type AMTrackData = {
  isrc: string;
  appleId: string;
  appleIds: string[];
  spotifyId: string;
  hasLyrics: boolean;
  title: string;
  artists: string[];
  album: string;
  albumNames: string[];
  duration: string;
};

type TargetData = {
  nameNorm: string;
  albumNorm: string;
  artistsLower: string[];
  artistCount: number;
  duration: number;
  isrc?: string;
};

const ACCENT_REGEX = /[\u0300-\u036f]/g;
const FEAT_REGEX = /\s*[([]?(?:feat\.?|ft\.?|featuring)\s+[^)\]]+[)\]]?/gi;
const SINGLE_EP_REGEX = /\s+-\s+(single|ep)$/gi;

function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - distance(a, b) / maxLen;
}

function removeAccents(str: string): string {
  if (!str) return "";
  return str.normalize("NFD").replace(ACCENT_REGEX, "");
}

function normalizeTitle(title: string): string {
  if (!title) return "";
  return removeAccents(title.toLowerCase()).replace(FEAT_REGEX, "").trim();
}

function normalizeAlbum(album: string): string {
  if (!album) return "";
  return removeAccents(album.toLowerCase()).replace(SINGLE_EP_REGEX, "").trim();
}

function calculateScore(attr: AppleSong["attributes"], target: TargetData): number {
  let score = 0;

  if (target.isrc && attr.isrc === target.isrc) {
    score += 150;
  }

  const diff = Math.abs(attr.durationInMillis - target.duration);
  if (diff > 1500) {
    score -= 100;
  } else if (diff <= 1500) {
    score += ((1500 - diff) / 1500) * 15;
  }

  const appleNameNorm = normalizeTitle(attr.name);
  if (appleNameNorm === target.nameNorm) {
    score += 45;
  } else {
    score += stringSimilarity(appleNameNorm, target.nameNorm) * 45;
  }

  const appleAlbumNorm = normalizeAlbum(attr.albumName);
  if (appleAlbumNorm === target.albumNorm) {
    score += 35;
  } else {
    score += stringSimilarity(appleAlbumNorm, target.albumNorm) * 35;
  }

  if (target.artistCount > 0) {
    const appleArtistLower = removeAccents(attr.artistName.toLowerCase());
    const appleTitleRawLower = removeAccents(attr.name.toLowerCase());
    let matchedArtists = 0;

    for (let i = 0; i < target.artistCount; i++) {
      const lowerArtist = target.artistsLower[i];
      if (appleArtistLower.includes(lowerArtist) || appleTitleRawLower.includes(lowerArtist)) {
        matchedArtists++;
      } else if (stringSimilarity(appleArtistLower, lowerArtist) > 0.8) {
        matchedArtists++;
      }
    }
    score += (matchedArtists / target.artistCount) * 20;
  }

  return score;
}

export async function getAppleFromSpotify(data: SpotifyTrackData): Promise<AMTrackData | null> {
  let results: AppleSong[] = [];

  if (data.isrc) {
    try {
      const isrcSearch = await searchTracksISRC(data.isrc);
      if (isrcSearch.data && isrcSearch.data.length > 0) {
        results = isrcSearch.data;
      }
    } catch (err) {
      logger.error({ isrc: data.isrc, err }, "isrc search failed");
    }
  }

  if (results.length === 0) {
    const firstArtist = data.artists[0] ?? "";
    const query = `${data.name || ""} ${firstArtist}`.trim();

    if (query.length > 0) {
      try {
        const textSearch = await searchSongs(encodeURIComponent(query));
        const songs = textSearch.results.songs?.data;
        if (songs && songs.length > 0) {
          results = songs;
        }
      } catch (err) {
        logger.error({ query, err }, "simple apple track search failed");
      }
    } else {
      logger.warn({ spotifyId: data.id }, "Skipped simple search: generated query was empty");
    }
  }

  if (results.length === 0) {
    const artistsStr = Array.isArray(data.artists) ? data.artists.join(",") : "";
    const query = `${data.name || ""} ${artistsStr} ${data.albumName || ""}`.trim();

    if (query.length > 0) {
      try {
        const deepSearch = await searchSongs(encodeURIComponent(query));
        const songs = deepSearch.results.songs?.data;
        if (songs && songs.length > 0) {
          results = songs;
        }
      } catch (err) {
        logger.error({ query, err }, "deep apple track search failed");
      }
    } else {
      logger.warn({ spotifyId: data.id }, "Skipped deep search: generated query was empty");
    }
  }

  if (results.length === 0) return null;

  const targetData: TargetData = {
    nameNorm: normalizeTitle(data.name),
    albumNorm: normalizeAlbum(data.albumName),
    artistsLower: data.artists.map((a) => removeAccents(a.toLowerCase())),
    artistCount: data.artists.length,
    duration: data.duration,
    isrc: data.isrc,
  };

  let bestResponse: { item: AppleSong; score: number } | null = null;
  const validIds = new Set<string>();
  const validAlbums = new Set<string>();

  for (let i = 0; i < results.length; i++) {
    const item = results[i];
    const score = calculateScore(item.attributes, targetData);

    if (!bestResponse || score > bestResponse.score) {
      bestResponse = { item, score };
    }

    if (score >= 80) {
      validIds.add(item.id);
      validAlbums.add(item.attributes.albumName);
    }
  }

  if (!bestResponse || bestResponse.score < 75) return null;

  const bestMatch = bestResponse.item;
  logger.info(
    {
      spotify: data.id,
      apple: bestMatch.id,
      score: bestResponse.score.toFixed(2),
    },
    `matched spotify to apple`,
  );

  return {
    isrc: data.isrc ?? bestMatch.attributes.isrc,
    appleId: bestMatch.id,
    appleIds: Array.from(validIds),
    spotifyId: data.id,
    hasLyrics: bestMatch.attributes.hasLyrics !== false,
    title: data.name,
    artists: data.artists,
    album: data.albumName,
    albumNames: Array.from(validAlbums),
    duration: data.duration.toString(),
  };
}
