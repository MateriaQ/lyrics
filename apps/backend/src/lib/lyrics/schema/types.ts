import { type Static } from "elysia";
import type {
  AuthorMetadataSchema,
  TTMLLyricsMetadataSchema,
  LyricsMetadataSchema,
} from "@/lib/lyrics/schema/metadata";
import type {
  LineDataSchema,
  StaticDataSchema,
  SyllableDataSchema,
  LineContentSchema,
  SyllableContentSchema,
  SyllableSchema,
  LinePartSchema,
  SongLyricsSchema,
  InstrumentalSchema,
  LyricsSchema,
} from "@/lib/lyrics/schema/lyrics";

export type AuthorMetadata = Static<typeof AuthorMetadataSchema>;
export type LyricsMetadata = Static<typeof LyricsMetadataSchema>;
export type TTMLLyricsMetadata = Static<typeof TTMLLyricsMetadataSchema>;

export type Lyrics = Static<typeof SongLyricsSchema>;
export type InstrumentalData = Static<typeof InstrumentalSchema>;
export type LyricsData = Static<typeof LyricsSchema>;

export type StaticData = Static<typeof StaticDataSchema>;

export type SyllableData = Static<typeof SyllableDataSchema>;
export type SyllableContent = Static<typeof SyllableContentSchema>;
export type VocalPart = Static<typeof LinePartSchema>;
export type Syllable = Static<typeof SyllableSchema>;

export type LineData = Static<typeof LineDataSchema>;
export type LineContent = Static<typeof LineContentSchema>;
