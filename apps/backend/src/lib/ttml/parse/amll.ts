import type { TTMLP, TTMLSpan, TTMLRoot } from "@/lib/ttml/parse/utils";
import {
  checkIsWordBoundary,
  extractAgents,
  extractSongwriters,
  getTTMLTextContent,
  DuetTracker,
  parseTime,
  toArray,
  stripParens,
} from "@/lib/ttml/parse/utils";
import type {
  Syllable,
  SyllableContent,
  LineContent,
  LyricsData,
  TTMLLyricsMetadata,
  VocalPart,
  AuthorMetadata,
  StaticData,
  LineData,
  SyllableData,
} from "@/lib/lyrics/schema";

interface ParseContext {
  transLangs: string[];
  romanLangs: string[];
}

function processAmllSpans(
  spans: TTMLSpan[],
  isBg: boolean,
): { syllables: Syllable[]; minStart: number; maxEnd: number } {
  const syllables: Syllable[] = [];
  let minStart = Infinity,
    maxEnd = 0;

  const validSpans: { rawText: string; text: string; start: number; end: number }[] = [];
  const spansLen = spans.length;

  for (let i = 0; i < spansLen; i++) {
    const span = spans[i];
    if (!span) continue;

    let rawText = span["#text"] || "";
    if (isBg) rawText = stripParens(rawText);

    const text = rawText.trim();
    if (isBg && !text) continue;

    validSpans.push({ rawText, text, start: parseTime(span.begin), end: parseTime(span.end) });
  }

  for (let i = 0; i < validSpans.length; i++) {
    const { rawText, text, start, end } = validSpans[i]!;
    if (start < minStart) minStart = start;
    if (end > maxEnd) maxEnd = end;

    const nextRawText = i + 1 < validSpans.length ? validSpans[i + 1]!.rawText : null;
    const syllable: Syllable = { text, start, end };

    if (checkIsWordBoundary(rawText, nextRawText)) {
      syllable.space = true;
    }

    syllables.push(syllable);
  }

  return { syllables, minStart, maxEnd };
}

function extractAmllExtras(node: TTMLP | TTMLSpan, ctx: ParseContext) {
  let translated: Record<string, string> | undefined;
  let roman: string | undefined;

  if (node.span) {
    const spans = toArray(node.span);

    for (let i = 0; i < spans.length; i++) {
      const span = spans[i];
      if (!span) continue;

      const role = span["ttm:role"];
      if (role === "x-translation") {
        const lang = span["xml:lang"] || "unknown";
        if (lang.toLowerCase().startsWith("zh")) {
          continue;
        }

        if (!ctx.transLangs.includes(lang)) {
          ctx.transLangs.push(lang);
        }

        if (!translated) translated = {};
        translated[lang] = getTTMLTextContent(span, "all", false, true).trim();
      } else if (role === "x-roman") {
        roman = getTTMLTextContent(span, "all", false, true).trim();
      }
    }
  }

  return { translated, roman };
}

function parseAmllSyllableLine(
  p: TTMLP,
  agentId: string | undefined | null,
  ctx: ParseContext,
): SyllableContent | null {
  const pBegin = parseTime(p.begin);
  const pEnd = parseTime(p.end);

  const leadSpans: TTMLSpan[] = [];
  const bgSpans: TTMLSpan[] = [];
  const leadExtras = extractAmllExtras(p, ctx);
  let bgExtras;

  const spans = toArray(p.span);

  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    if (!span) continue;
    const role = span["ttm:role"];

    if (role === "x-translation" || role === "x-roman") continue;

    if (role === "x-bg") {
      bgExtras = extractAmllExtras(span, ctx);
      if (span.span) {
        const innerSpans = toArray(span.span);
        for (let j = 0; j < innerSpans.length; j++) {
          const bgSpan = innerSpans[j];
          if (
            bgSpan &&
            bgSpan["ttm:role"] !== "x-translation" &&
            bgSpan["ttm:role"] !== "x-roman"
          ) {
            bgSpans.push(bgSpan);
          }
        }
      }
    } else if (span["#text"] !== undefined) {
      leadSpans.push(span);
    }
  }

  const leadResult = processAmllSpans(leadSpans, false);
  const bgResult = processAmllSpans(bgSpans, true);

  if (leadResult.syllables.length === 0 && bgResult.syllables.length === 0) {
    const rawText = (p["#text"] || "").trim();
    if (rawText) {
      leadResult.syllables.push({
        start: pBegin,
        end: pEnd,
        text: rawText,
      });
    } else {
      return null;
    }
  }

  const lead: SyllableContent["lead"] = {
    start: pBegin,
    end: pEnd,
    syllables: leadResult.syllables,
  };
  if (agentId) {
    lead.agent = { id: agentId };
  }
  const result: SyllableContent = {
    start: pBegin,
    end: pEnd,
    lead,
  };

  if (leadExtras.translated) result.lead.translated = leadExtras.translated;

  if (bgResult.syllables.length > 0) {
    const bgContent: VocalPart = {
      start: bgResult.minStart === Infinity ? pBegin : bgResult.minStart,
      end: bgResult.maxEnd || pEnd,
      syllables: bgResult.syllables,
    };
    if (agentId) bgContent.agent = { id: agentId };
    if (bgExtras?.translated) bgContent.translated = bgExtras.translated;
    result.bg = [bgContent];
  }

  return result;
}

export function parseAmll(
  ttml: TTMLRoot,
  _timing: string,
): { data: LyricsData; meta: TTMLLyricsMetadata } {
  const metadata = ttml.tt?.head?.metadata;
  const amllMeta: Record<string, string[]> = {};
  const meta: TTMLLyricsMetadata = {};

  const metaArr = toArray(metadata?.["amll:meta"]);
  for (let i = 0; i < metaArr.length; i++) {
    const m = metaArr[i];
    if (m?.key && m.value !== undefined) {
      const key = m.key;
      if (!amllMeta[key]) amllMeta[key] = [];
      amllMeta[key].push(String(m.value));
    }
  }

  const bodyDur = ttml.tt?.body?.dur;
  if (bodyDur) {
    const parsedDurMs = parseTime(bodyDur);
    if (parsedDurMs > 0) {
      amllMeta["duration"] = [parsedDurMs.toString()];
    }
  }

  const githubLogins = amllMeta["ttmlAuthorGithubLogin"] || [];
  const githubIds = amllMeta["ttmlAuthorGithub"] || [];
  const authorsCount = Math.max(githubLogins.length, githubIds.length);

  if (authorsCount > 0) {
    meta.authors = [];
    for (let i = 0; i < authorsCount; i++) {
      const username = githubLogins[i];
      const id = githubIds[i];

      const author: AuthorMetadata = {
        name: username || id || "Unknown",
      };

      if (id || username) {
        author.github = {
          id: id || "",
          username: username || "",
        };
      }

      if (id) {
        author.image = `https://avatars.githubusercontent.com/u/${id}?v=4`;
      } else if (username) {
        author.image = `https://github.com/${username}.png`;
      }

      if (username) author.url = `https://github.com/${username}`;

      meta.authors.push(author);
    }
  }

  const agentsData = extractAgents(metadata);
  const defaultAgent = agentsData.list.length > 0 ? "v1" : null;

  if (agentsData.list.length > 0) {
    meta.agents = agentsData.list;
  }

  const songwriters = extractSongwriters(metadata);
  if (songwriters.length > 0) meta.song_writers = songwriters;
  if (Object.keys(amllMeta).length > 0) meta.amll = amllMeta;

  const divs = toArray(ttml.tt?.body?.div);
  const ctx: ParseContext = { transLangs: [], romanLangs: [] };

  if (_timing === "None") {
    const lines: StaticData["lines"] = [];
    for (let i = 0; i < divs.length; i++) {
      const ps = toArray(divs[i]?.p);
      for (let j = 0; j < ps.length; j++) {
        const p = ps[j];
        if (!p) continue;

        const rawText = getTTMLTextContent(p, "all").trim();
        if (!rawText) continue;

        const extras = extractAmllExtras(p, ctx);
        const lineItem: StaticData["lines"][number] = { text: rawText };
        if (extras.translated) lineItem.translated = extras.translated;
        if (extras.roman) lineItem.roman = extras.roman;
        lines.push(lineItem);
      }
    }
    if (ctx.transLangs.length > 0) meta.translations = ctx.transLangs;
    return { data: { type: "static", lines }, meta };
  }

  let start = 0,
    end = 0;

  const lineParts: LineData["parts"] = [];
  const syllableParts: SyllableData["parts"] = [];
  const agentSequence: string[] = [];

  for (let i = 0; i < divs.length; i++) {
    const div = divs[i];
    if (!div) continue;

    const ps = toArray(div.p);
    const divAgent = div["ttm:agent"];
    const part = div["itunes:song-part"] || div["itunes:songPart"];

    const lineContent: LineContent[] = [];
    const syllableContent: SyllableContent[] = [];

    for (let j = 0; j < ps.length; j++) {
      const p = ps[j];
      if (!p) continue;

      const agentId = p["ttm:agent"] ?? divAgent ?? defaultAgent;
      if (agentId) agentSequence.push(agentId);

      if (_timing === "Line") {
        const text = getTTMLTextContent(p, "all").trim();
        if (!text) continue;

        const pBegin = parseTime(p.begin);
        const pEnd = parseTime(p.end);
        if (lineParts.length === 0 && lineContent.length === 0) start = pBegin;
        end = pEnd;

        const extras = extractAmllExtras(p, ctx);

        const lineObj: LineContent = {
          start: pBegin,
          end: pEnd,
          text,
        };
        if (agentId) lineObj.agent = { id: agentId };
        if (extras.translated) lineObj.translated = extras.translated;
        if (extras.roman) lineObj.roman = extras.roman;
        lineContent.push(lineObj);
      } else {
        const parsed = parseAmllSyllableLine(p, agentId, ctx);
        if (parsed) {
          if (syllableParts.length === 0 && syllableContent.length === 0) start = parsed.start;
          end = parsed.end;
          syllableContent.push(parsed);
        }
      }
    }

    if (_timing === "Line" && lineContent.length > 0) {
      lineParts.push(part ? { part, content: lineContent } : { content: lineContent });
    } else if (_timing !== "Line" && syllableContent.length > 0) {
      syllableParts.push(part ? { part, content: syllableContent } : { content: syllableContent });
    }
  }

  const tracker = new DuetTracker(agentSequence, agentsData.map);

  if (_timing === "Line") {
    let seqIndex = 0;
    for (let i = 0; i < lineParts.length; i++) {
      const content = lineParts[i].content;
      for (let j = 0; j < content.length; j++) {
        const l = content[j];
        if (l.agent?.id) {
          if (tracker.isDuet(seqIndex)) {
            l.duet = true;
          }
          seqIndex++;
        }
      }
    }
  } else {
    let seqIndex = 0;
    for (let i = 0; i < syllableParts.length; i++) {
      const content = syllableParts[i].content;
      for (let j = 0; j < content.length; j++) {
        const l = content[j];
        if (l.lead?.agent?.id) {
          if (tracker.isDuet(seqIndex)) {
            l.lead.duet = true;
            if (l.bg) {
              for (let k = 0; k < l.bg.length; k++) {
                l.bg[k]!.duet = true;
              }
            }
          }
          seqIndex++;
        }
      }
    }
  }

  if (ctx.transLangs.length > 0) meta.translations = ctx.transLangs;

  if (_timing === "Line") {
    return {
      data: {
        type: "line",
        start,
        end,
        parts: lineParts,
      },
      meta,
    };
  }

  return {
    data: {
      type: "syllable",
      parts: syllableParts,
      start,
      end,
    },
    meta,
  };
}
