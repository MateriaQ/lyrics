import env from "@/env";
import { AppleFetch } from "@/lib/apple/fetch";

export async function searchTracksISRC(isrc: string): Promise<AppleISRCSearchResponse> {
  const res = await AppleFetch(
    `https://api.music.apple.com/v1/catalog/${env.APPLE_STOREFRONT}/songs?filter[isrc]=${isrc}`,
  );

  if (!res.ok) {
    throw new Error(`Apple Music API Error: ${res.status} ${res.statusText}`, { cause: res });
  }

  return res.json() as Promise<AppleISRCSearchResponse>;
}

export async function searchSongs(term: string): Promise<AppleSearchResponse> {
  const res = await AppleFetch(
    `https://api.music.apple.com/v1/catalog/${env.APPLE_STOREFRONT}/search?types=songs&term=${term}`,
  );

  if (!res.ok) {
    throw new Error(`Apple Music API Error: ${res.status} ${res.statusText}`, { cause: res });
  }

  return res.json() as Promise<AppleSearchResponse>;
}

export interface AppleSearchResponse {
  results: {
    songs?: {
      href: string;
      data: AppleSong[];
    };
  };
  meta: {
    results: {
      order: string[];
      rawOrder: string[];
    };
  };
}

export interface AppleISRCSearchResponse {
  data: AppleSong[];
  meta?: {
    filters: {
      isrc: Record<string, AppleSong>;
    };
  };
}

export interface AppleArtwork {
  bgColor: string;
  height: number;
  textColor1: string;
  textColor2: string;
  textColor3: string;
  textColor4: string;
  url: string;
  width: number;
}

export interface ApplePlayParams {
  id: string;
  kind: string;
}

export interface ApplePreview {
  url: string;
}

export interface AppleSongAttributes {
  albumName: string;
  artistName: string;
  artwork: AppleArtwork;
  composerName?: string;
  discNumber: number;
  durationInMillis: number;
  genreNames: string[];
  hasLyrics: boolean;
  isAppleDigitalMaster: boolean;
  isrc: string;
  name: string;
  playParams: ApplePlayParams;
  previews: ApplePreview[];
  releaseDate: string;
  trackNumber: number;
  url: string;
  contentRating?: string;
}

export interface AppleSong {
  id: string;
  type: "songs";
  href: string;
  attributes: AppleSongAttributes;
  relationships?: {
    albums: AppleRelationship;
    artists: AppleRelationship;
  };
}

export interface AppleRelationship {
  href: string;
  data: {
    id: string;
    type: string;
    href: string;
  }[];
}
