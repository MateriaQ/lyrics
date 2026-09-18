export type LyricsError = {
  error: string;
  message?: string;
  code?: number;
};

export type LyricsResult = {
  format: "json";
} & (
  | {
      httpStatus: 200;
      data: Lyrics;
    }
  | { httpStatus: 401 | 403 | 404 | 500; data: LyricsError }
);

export type SpicyQuery =
  | {
      operation: "lyrics";
      operationId: string;
      result: LyricsResult;
    }
  | { _notice: string };

export type SpicyResponse = {
  queries: SpicyQuery[];
};

type SpicyVariables = {
  id: string;
  auth: "SpicyLyrics-WebAuth";
};

export type SpicyRequestPayload = {
  operation: "lyrics";
  variables: SpicyVariables;
};

/**
 * Is Subject to change
 */
type TTMLUser = {
  id: string;
  username: string;
  avatar: string;
  hasProfileBanner: boolean;
};

type _SpicySpecific =
  | {
      source: "aml";
    }
  | {
      source: "spl";
      /**
       * Is Subject to change
       */
      TTMLUploadMetadata: Partial<{
        Uploader: Partial<TTMLUser>;
        Maker: Partial<TTMLUser>;
      }>;
    };
export type Lyrics = (SyllableData | LineData | StaticData) &
  _SpicySpecific & {
    /**
     * NOTE: added manually when source is 'spl'
     */
    isCommunity?: boolean;
  };
type TimeRange = {
  StartTime: number;
  EndTime: number;
};

/* Syllables */
type Syllable = {
  Text: string;
  IsPartOfWord: boolean;
  EmptyBeat?: number;
} & TimeRange;

/* Vocal parts */
type VocalPart = {
  Syllables: Syllable[];
} & TimeRange;

type AlignedContent = {
  OppositeAligned: boolean;
  IsRTL?: boolean;
};

/* Syllable lyrics */
type SyllableContent = {
  Type: "Vocal";
  Lead: VocalPart;
  Background?: VocalPart[];
} & AlignedContent;

type SyllableData = {
  Id: string;
  Type: "Syllable";
  SongWriters: string[];
  Artists?: string[];
  Content: SyllableContent[];
} & TimeRange;

/* Line lyrics */
type LineContent = {
  Type: string;
  Text: string;
} & TimeRange &
  AlignedContent;

type InterludeContent = {
  Type: "Interlude";
  Text: string;
} & TimeRange &
  AlignedContent;

type LineData = {
  Id: string;
  Type: "Line";
  SongWriters: string[];
  Artists?: string[];
  Content: (LineContent | InterludeContent)[];
} & TimeRange;

/* Static lyrics */
type StaticLine = {
  Text: string;
  IsRTL?: boolean;
};

type StaticData = {
  Id: string;
  Type: "Static";
  SongWriters: string[];
  Artists?: string[];
  Lines: StaticLine[];
};
