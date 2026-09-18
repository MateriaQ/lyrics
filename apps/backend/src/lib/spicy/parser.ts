import type { Lyrics } from "@/lib/spicy/types";
import type {
  LyricsData,
  StaticData,
  LineData,
  LineContent,
  SyllableData,
  SyllableContent,
  Syllable,
  VocalPart,
  LyricsMetadata,
} from "@/lib/lyrics/schema";
import { logger } from "@/logger";

const p = (time: number) => Math.round(time * 1000);

function getValidTime(val: any): number | null {
  if (val == null || (typeof val === "string" && val.trim() === "")) return null;
  const num = Number(val);
  return Number.isNaN(num) ? null : num;
}

export function parseSpicy(rawLyrics: Lyrics): { lyrics: LyricsData; meta: LyricsMetadata } | null {
  const meta: LyricsMetadata = {
    song_writers: rawLyrics.SongWriters?.length ? rawLyrics.SongWriters : [],
    authors: [],
  };

  if (rawLyrics.source === "spl" && rawLyrics?.TTMLUploadMetadata) {
    const uploader = rawLyrics.TTMLUploadMetadata.Maker?.username
      ? rawLyrics.TTMLUploadMetadata.Maker
      : rawLyrics.TTMLUploadMetadata.Uploader;

    if (uploader) {
      const {
        // avatar,
        id,
        username: name,
      } = uploader;

      if (id && name) {
        const url = `https://spicylyrics.org/uid/${uploader.id}`;
        const author = {
          name,
          url,
          spicy: {
            id,
            name,
            url,
            // avatar,
          },
        };
        if (meta.authors) meta.authors.push(author);
        else meta.authors = [author];
      }
    }
  }

  let lyrics: LyricsData;
  let hasDuet = false;

  if ("Content" in rawLyrics) {
    hasDuet = !!rawLyrics.Content.find((c) => c?.OppositeAligned);
  }

  switch (rawLyrics.Type) {
    case "Static": {
      const linesLen = rawLyrics.Lines.length;
      const staticLines: StaticData["lines"] = new Array(linesLen);

      for (let i = 0; i < linesLen; i++) {
        staticLines[i] = { text: rawLyrics.Lines[i]!.Text };
      }

      lyrics = {
        type: "static",
        lines: staticLines,
      } satisfies StaticData;
      break;
    }

    case "Line": {
      const lineContent: LineContent[] = [];
      let fallbackStart = Infinity;
      let fallbackEnd = -Infinity;

      for (let i = 0; i < rawLyrics.Content.length; i++) {
        const c = rawLyrics.Content[i]!;
        const cStart = getValidTime(c.StartTime);
        const cEnd = getValidTime(c.EndTime);

        if (cStart === null || cEnd === null) continue;

        const isDuet = !!c.OppositeAligned;

        const start = p(cStart);
        const end = p(cEnd);

        if (start < fallbackStart) fallbackStart = start;
        if (end > fallbackEnd) fallbackEnd = end;

        const data: LineContent = {
          start,
          end,
          text: c.Text,
        };

        if (hasDuet) data.agent = { id: isDuet ? "v2" : "v1" };
        if (isDuet) data.duet = true;

        lineContent.push(data);
      }

      const rootStart = getValidTime(rawLyrics.StartTime);
      const rootEnd = getValidTime(rawLyrics.EndTime);

      lyrics = {
        type: "line",
        start: rootStart !== null ? p(rootStart) : fallbackStart === Infinity ? 0 : fallbackStart,
        end: rootEnd !== null ? p(rootEnd) : fallbackEnd === -Infinity ? 0 : fallbackEnd,
        parts: [{ content: lineContent }],
      } satisfies LineData;
      break;
    }

    case "Syllable": {
      const syllableContent: SyllableContent[] = [];
      let fallbackStart = Infinity;
      let fallbackEnd = -Infinity;

      for (let i = 0; i < rawLyrics.Content.length; i++) {
        const c = rawLyrics.Content[i]!;
        const leadStartRaw = getValidTime(c.Lead.StartTime);
        const leadEndRaw = getValidTime(c.Lead.EndTime);

        if (leadStartRaw === null || leadEndRaw === null) continue;

        const isDuet = !!c.OppositeAligned;
        const agentId = isDuet ? "v2" : "v1";

        const leadStart = p(leadStartRaw);
        const leadEnd = p(leadEndRaw);

        let wrapperStartMs = leadStart;
        let wrapperEndMs = leadEnd;

        const leadSyllablesLen = c.Lead.Syllables.length;
        const leadSyllables: Syllable[] = [];

        for (let j = 0; j < leadSyllablesLen; j++) {
          const s = c.Lead.Syllables[j]!;
          const sStart = getValidTime(s.StartTime);
          const sEnd = getValidTime(s.EndTime);

          if (sStart === null || sEnd === null) continue;

          const syllable: Syllable = {
            text: s.Text,
            start: p(sStart),
            end: p(sEnd),
          };
          if (!s.IsPartOfWord && j !== leadSyllablesLen - 1) syllable.space = true;
          leadSyllables.push(syllable);
        }

        let bg: VocalPart[] | undefined = undefined;
        if (c.Background) {
          const bgLen = c.Background.length;
          bg = [];

          for (let j = 0; j < bgLen; j++) {
            const b = c.Background[j]!;
            const bStart = getValidTime(b.StartTime);
            const bEnd = getValidTime(b.EndTime);

            if (bStart === null || bEnd === null) continue;

            const bgSyllablesLen = b.Syllables.length;
            const bgSyllables: Syllable[] = [];

            for (let k = 0; k < bgSyllablesLen; k++) {
              const s = b.Syllables[k]!;
              const sStartRaw = getValidTime(s.StartTime);
              const sEndRaw = getValidTime(s.EndTime);

              if (sStartRaw === null || sEndRaw === null) continue;

              bgSyllables.push({
                text: s.Text,
                start: p(sStartRaw),
                end: p(sEndRaw),
                space: !s.IsPartOfWord && k !== bgSyllablesLen - 1,
              });
            }

            const bgStartMs = p(bStart);
            const bgEndMs = p(bEnd);

            if (bgStartMs < wrapperStartMs) wrapperStartMs = bgStartMs;
            if (bgEndMs > wrapperEndMs) wrapperEndMs = bgEndMs;

            const data: VocalPart = {
              start: bgStartMs,
              end: bgEndMs,
              syllables: bgSyllables,
            };
            if (hasDuet) data.agent = { id: agentId };
            bg.push(data);
          }
        }

        if (wrapperStartMs < fallbackStart) fallbackStart = wrapperStartMs;
        if (wrapperEndMs > fallbackEnd) fallbackEnd = wrapperEndMs;

        const lead: SyllableContent["lead"] = {
          start: leadStart,
          end: leadEnd,
          syllables: leadSyllables,
        };

        if (hasDuet) lead.agent = { id: isDuet ? "v2" : "v1" };
        if (isDuet) lead.duet = true;

        const data: SyllableContent = {
          start: wrapperStartMs,
          end: wrapperEndMs,
          lead,
        };
        if (bg && bg.length > 0) {
          data.bg = bg;
        }
        syllableContent.push(data);
      }

      const rootStart = getValidTime(rawLyrics.StartTime);
      const rootEnd = getValidTime(rawLyrics.EndTime);

      lyrics = {
        type: "syllable",
        start: rootStart !== null ? p(rootStart) : fallbackStart === Infinity ? 0 : fallbackStart,
        end: rootEnd !== null ? p(rootEnd) : fallbackEnd === -Infinity ? 0 : fallbackEnd,
        parts: [{ content: syllableContent }],
      } satisfies SyllableData;
      break;
    }

    default:
      logger.error({ type: (rawLyrics as any)?.type }, "unknown lyrics type from spicy lyrics");
      return null;
  }

  if (hasDuet) {
    meta.agents = [
      { type: "person", id: "v1" },
      { type: "person", id: "v2" },
    ];
  }

  return { lyrics, meta };
}
