import type { LineData, LineContent, StaticData, LyricsMetadata } from "@/lib/lyrics/schema";

interface ILyric {
  time?: number;
  text: string;
}

type State = Readonly<{
  info: Map<string, string>;
  lyric: readonly ILyric[];
}>;

type TrimOptions = Partial<{
  trimStart: boolean;
  trimEnd: boolean;
}>;

const TIME_TAG_RX = /^\[\s*(\d{1,3}):(\d{1,2}(?:[:.]\d{1,3})?)\s*](.*)$/;
const INFO_TAG_RX = /^\[\s*(\w{1,6})\s*:(.*?)]$/;

function parser(lrcString: string, option: TrimOptions = {}): State {
  const trimStart = option.trimStart ?? true;
  const trimEnd = option.trimEnd ?? false;

  const info = new Map<string, string>();
  const lyric: ILyric[] = [];

  const lines = lrcString.split("\n");

  const applyTrim = (str: string) => {
    if (trimStart && trimEnd) return str.trim();
    if (trimStart) return str.trimStart();
    if (trimEnd) return str.trimEnd();
    return str;
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.charCodeAt(line.length - 1) === 13) {
      line = line.slice(0, -1);
    }

    if (line[0] !== "[") {
      lyric.push({ text: applyTrim(line) });
      continue;
    }

    const rTimeTag = TIME_TAG_RX.exec(line);
    if (rTimeTag !== null) {
      const mm = Number.parseInt(rTimeTag[1], 10);
      const ss = Number.parseFloat(rTimeTag[2].replace(":", "."));

      lyric.push({
        time: mm * 60 + ss,
        text: applyTrim(rTimeTag[3]),
      });
      continue;
    }

    const rInfoTag = INFO_TAG_RX.exec(line);
    if (rInfoTag !== null) {
      const value = rInfoTag[2].trim();
      if (value !== "") {
        info.set(rInfoTag[1], value);
      }
      continue;
    }

    lyric.push({ text: applyTrim(line) });
  }

  return { info, lyric };
}

export function parseLrcLyrics(data: {
  duration?: number;
  syncedLyrics: string;
}): { lyrics: LineData | StaticData; meta: LyricsMetadata } | null {
  const { duration, syncedLyrics } = data;

  if (typeof syncedLyrics !== "string" || syncedLyrics.trim() === "") {
    return null;
  }

  const parsed = parser(syncedLyrics);
  const durationMs = duration ? Math.round(duration * 1000) : undefined;

  const rawTimed: { start: number; text: string; isEmpty: boolean }[] = [];
  const staticLines: { text: string }[] = [];

  for (let i = 0; i < parsed.lyric.length; i++) {
    const line = parsed.lyric[i];
    const fullyTrimmed = line.text.trim();
    const isEmpty = fullyTrimmed === "";

    if (line.time !== undefined) {
      rawTimed.push({
        start: Math.round(line.time * 1000),
        text: line.text,
        isEmpty,
      });
    } else if (!isEmpty) {
      staticLines.push({ text: fullyTrimmed });
    }
  }

  if (rawTimed.length > 0) {
    const content: LineContent[] = [];

    rawTimed.sort((a, b) => a.start - b.start);

    for (let i = 0; i < rawTimed.length; i++) {
      const current = rawTimed[i];

      if (current.isEmpty) continue;

      let nextStart = current.start;
      for (let j = i + 1; j < rawTimed.length; j++) {
        if (rawTimed[j].start > current.start) {
          nextStart = rawTimed[j].start;
          break;
        }
      }

      const end =
        nextStart > current.start
          ? nextStart
          : durationMs && durationMs > current.start
            ? durationMs
            : current.start;

      content.push({
        start: current.start,
        end,
        text: current.text,
      });
    }

    if (content.length > 0) {
      return {
        lyrics: {
          type: "line",
          start: content[0].start,
          end: content[content.length - 1].end,
          parts: [{ content }],
        } satisfies LineData,
        meta: {},
      };
    }
  }

  if (staticLines.length === 0) {
    return null;
  }

  return {
    lyrics: {
      type: "static",
      lines: staticLines,
    } satisfies StaticData,
    meta: {},
  };
}
