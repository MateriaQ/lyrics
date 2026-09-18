import { t } from "elysia";
import { MetadataSchema } from "@/lib/lyrics/schema/metadata";

// Common
const TimeRangeSchema = t.Object(
  {
    start: t.Number(),
    end: t.Number(),
  },
  {
    title: "Time Range",
  },
);

// Syllable
export const SyllableSchema = t.Object(
  {
    text: t.String(),
    start: t.Number(),
    end: t.Number(),
    space: t.Optional(t.Boolean()),
    roman: t.Optional(t.String()),
  },
  {
    title: "Syllable",
  },
);

export const LinePartSchema = t.Object(
  {
    start: t.Number(),
    end: t.Number(),
    duet: t.Optional(t.Boolean()),
    rtl: t.Optional(t.Boolean()),
    agent: t.Optional(
      t.Object(
        {
          id: t.String(),
        },
        { title: "Agent" },
      ),
    ),
    syllables: t.Array(SyllableSchema),
    translated: t.Optional(t.Record(t.String(), t.Optional(t.String()))),
  },
  {
    title: "Line Part",
  },
);

export const SyllableContentSchema = t.Object(
  {
    start: t.Number(),
    end: t.Number(),
    lead: LinePartSchema,
    bg: t.Optional(t.Array(LinePartSchema)),
  },
  {
    title: "Syllable Content",
  },
);

// Line
export const LineContentSchema = t.Object(
  {
    start: t.Number(),
    end: t.Number(),
    rtl: t.Optional(t.Boolean()),
    text: t.String(),
    duet: t.Optional(t.Boolean()),
    agent: t.Optional(
      t.Object(
        {
          id: t.String(),
        },
        { title: "Agent" },
      ),
    ),
    translated: t.Optional(t.Record(t.String(), t.Optional(t.String()))),
    roman: t.Optional(t.String()),
  },
  {
    title: "Line Content",
  },
);

// Parts
const LinePartsSchema = t.Object(
  {
    part: t.Optional(t.String()),
    content: t.Array(LineContentSchema),
  },
  {
    title: "Line Parts",
  },
);

const SyllablePartsSchema = t.Object(
  {
    part: t.Optional(t.String()),
    content: t.Array(SyllableContentSchema),
  },
  {
    title: "Syllable Parts",
  },
);

// Static
export const StaticDataSchema = t.Object(
  {
    type: t.Literal("static"),
    lines: t.Array(
      t.Object(
        {
          rtl: t.Optional(t.Boolean()),
          text: t.String(),
          translated: t.Optional(t.Record(t.String(), t.Optional(t.String()))),
          roman: t.Optional(t.String()),
        },
        { title: "Static Line" },
      ),
    ),
  },
  {
    title: "Static Lyrics",
  },
);

// Line Data
export const LineDataSchema = t.Object(
  {
    type: t.Literal("line"),
    start: t.Number(),
    end: t.Number(),
    parts: t.Array(LinePartsSchema),
  },
  {
    title: "Line Lyrics",
  },
);

// Syllable Data
export const SyllableDataSchema = t.Object(
  {
    type: t.Literal("syllable"),
    start: t.Number(),
    end: t.Number(),
    parts: t.Array(SyllablePartsSchema),
  },
  {
    title: "Syllable Lyrics",
  },
);

export const LyricsSchema = t.Union([StaticDataSchema, LineDataSchema, SyllableDataSchema], {
  title: "Lyrics Format",
});

export const SongLyricsSchema = t.Composite(
  [
    t.Object({
      type: t.Literal("lyrics"),
      lyrics: LyricsSchema,
    }),
    MetadataSchema,
  ],
  {
    title: "Song Lyrics",
  },
);

export const InstrumentalSchema = t.Object(
  {
    type: t.Literal("instrumental"),
  },
  {
    title: "Instrumental Lyrics",
  },
);

export const LyricsResponseSchema = t.Union([SongLyricsSchema, InstrumentalSchema], {
  title: "Lyrics",
});
