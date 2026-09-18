import env from "@/env";
import { AppleFetch } from "@/lib/apple/fetch";

interface LyricsData {
  id: string;
  type: string;
  attributes: Attributes;
}

interface Attributes {
  playParams: PlayParams;
  ttmlLocalizations?: string;
  ttml?: string;
}

interface PlayParams {
  catalogId: string;
  displayType: number;
  id: string;
  kind: string;
}

type LyricsResponse = {
  data: LyricsData[];
};

export async function getAppleLyrics(id: string): Promise<LyricsResponse | null> {
  const res = await AppleFetch(
    `https://amp-api.music.apple.com/v1/catalog/${env.APPLE_STOREFRONT}/songs/${id}/syllable-lyrics?l[lyrics]=en-gb&l[script]=en-Latn&extend=ttmlLocalizations`,
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Apple Music API Error: ${res.status} ${res.statusText}`, { cause: res });
  }

  return (await res.json()) as LyricsResponse;
}
