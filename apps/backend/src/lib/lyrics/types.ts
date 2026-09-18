import type { EventEmitter } from "node:events";
import type { Provider } from "@/db/schema/lyrics";
import type { getTrackData, SpotifyLyricsResponse } from "@/lib/spotify";
import type { Lyrics as SpicyLyrics } from "@/lib/spicy/types";
import type { InstrumentalData, Lyrics } from "@/lib/lyrics/schema";

export type ErrorCodes = "NOT_FOUND" | "SERVER_ERROR";

export type ErrorResponse = {
  code: ErrorCodes;
  message: string;
};

export type LyricsResponse =
  | { status: "success"; data: Lyrics }
  | { status: "success"; data: InstrumentalData }
  | { status: "error"; error: ErrorResponse };

export type APIResponse =
  | { provider: "apple"; raw: string; parsed: Lyrics }
  | { provider: "spotify"; raw: SpotifyLyricsResponse; parsed: Lyrics }
  | { provider: "spicy"; raw: SpicyLyrics; parsed: Lyrics; isCommunity: boolean }
  | { provider: "amll"; raw: string; parsed: Lyrics }
  | { provider: "musixmatch"; raw: string; parsed: Lyrics };

export type FetchResult = { provider: Provider } & (
  | { status: "success"; data: APIResponse }
  | { status: "not_found" }
  | { status: "error"; reason: string }
);

export type MusixmatchExtraData = {
  ids?: { spotify: string[]; apple: string[] };
  instrumental?: boolean;
};

export type MusixmatchTaskResult = FetchResult & MusixmatchExtraData;

export type TrackData = Awaited<ReturnType<typeof getTrackData>>;

export interface WaitlistEmitter extends EventEmitter {
  emit(eventName: string): boolean;
  on(eventName: string, listener: () => void): this;
  once(eventName: string, listener: () => void): this;
  off(eventName: string, listener: () => void): this;
}

export type LyricsData = {
  provider: Provider;
  parsed: Lyrics;
  isCommunity?: boolean;
};

export type RomanizedAPIResponse = APIResponse & {
  romanSuccess: boolean;
  romanVersion: number;
};
