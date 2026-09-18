import type { TTMLP, TTMLSpan, TTMLRoot, TTMLTextItem } from "@/lib/ttml/parse/utils";
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
  StaticData,
  LineData,
  SyllableData,
} from "@/lib/lyrics/schema";

function processAppleSpans(
  spans: TTMLSpan[],
  romanSyllables: Record<string, Map<number, string>>,
  romanLangs: string[],
  isBg: boolean,
): { syllables: Syllable[]; minStart: number; maxEnd: number } {
  const syllables: Syllable[] = [];
  let minStart = Infinity;
  let maxEnd = 0;

  const validSpans: { rawText: string; text: string; start: number; end: number }[] = [];

  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    if (!span) continue;

    let rawText = span["#text"] || "";
    if (isBg) rawText = stripParens(rawText);

    const text = rawText.trim();
    if (isBg && !text) continue;

    validSpans.push({
      rawText,
      text,
      start: parseTime(span.begin),
      end: parseTime(span.end),
    });
  }

  for (let i = 0; i < validSpans.length; i++) {
    const vs = validSpans[i]!;

    if (vs.start < minStart) minStart = vs.start;
    if (vs.end > maxEnd) maxEnd = vs.end;

    let roman: string | undefined;
    for (let r = 0; r < romanLangs.length; r++) {
      const romText = romanSyllables[romanLangs[r]!]?.get(vs.start);
      if (romText && romText !== vs.text) {
        roman = romText;
        break;
      }
    }

    const nextRawText = i + 1 < validSpans.length ? validSpans[i + 1]!.rawText : null;
    const syllable: Syllable = { text: vs.text, start: vs.start, end: vs.end };

    if (roman) syllable.roman = roman;
    if (checkIsWordBoundary(vs.rawText, nextRawText)) syllable.space = true;

    syllables.push(syllable);
  }

  return { syllables, minStart, maxEnd };
}

function parseAppleSyllableLine(
  p: TTMLP,
  agentId: string | undefined | null,
  romanSyllablesLead: Record<string, Map<number, string>>,
  romanSyllablesBg: Record<string, Map<number, string>>,
  romanLangs: string[],
): SyllableContent {
  const pBegin = parseTime(p.begin);
  const pEnd = parseTime(p.end);

  const leadSpans: TTMLSpan[] = [];
  const bgSpans: TTMLSpan[] = [];

  const spans = toArray(p.span);

  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    if (!span) continue;

    if (span["ttm:role"] === "x-bg") {
      if (span.span) {
        const innerSpans = toArray(span.span);
        for (let j = 0; j < innerSpans.length; j++) {
          const innerSpan = innerSpans[j];
          if (!innerSpan) continue;
          const role = innerSpan["ttm:role"];
          if (role === "x-roman" || role === "x-translation") continue;
          bgSpans.push(innerSpan);
        }
      }
    } else if (span["#text"] !== undefined) {
      leadSpans.push(span);
    }
  }

  const leadResult = processAppleSpans(leadSpans, romanSyllablesLead, romanLangs, false);
  const bgResult = processAppleSpans(bgSpans, romanSyllablesBg, romanLangs, true);

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

  if (bgResult.syllables.length > 0) {
    const bgContent: VocalPart = {
      start: bgResult.minStart === Infinity ? pBegin : bgResult.minStart,
      end: bgResult.maxEnd || pEnd,
      syllables: bgResult.syllables,
    };

    if (agentId) bgContent.agent = { id: agentId };
    result.bg = [bgContent];
  }

  return result;
}

function processAppleRomanNode(
  n: string | TTMLSpan,
  isInsideBg: boolean,
  leadSylMap: Map<number, string>,
  bgSylMap: Map<number, string>,
) {
  if (typeof n === "string") return;
  const currentIsBg = isInsideBg || n["ttm:role"] === "x-bg";

  if (n.begin && n["#text"]) {
    const time = parseTime(n.begin);
    const text = currentIsBg ? stripParens(n["#text"]).trim() : n["#text"].trim();
    if (text) {
      if (currentIsBg) bgSylMap.set(time, text);
      else leadSylMap.set(time, text);
    }
  }

  if (n.span) {
    const spans = toArray(n.span);
    for (let i = 0; i < spans.length; i++) {
      if (spans[i]) processAppleRomanNode(spans[i]!, currentIsBg, leadSylMap, bgSylMap);
    }
  }
}

export function parseApple(
  ttml: TTMLRoot,
  timing: string,
): { data: LyricsData; meta: TTMLLyricsMetadata } {
  const metadata = ttml.tt?.head?.metadata;
  const divs = toArray(ttml.tt?.body?.div);

  const translations: Record<string, Record<string, TTMLTextItem>> = {};
  const transliterations: Record<string, Record<string, TTMLTextItem>> = {};

  const transArr = toArray(metadata?.iTunesMetadata?.translations?.translation);
  for (let i = 0; i < transArr.length; i++) {
    const t = transArr[i];
    if (!t) continue;
    const lang = t["xml:lang"] || "en-US";
    const langDict = (translations[lang] ??= {});

    const texts = toArray(t.text);
    for (let j = 0; j < texts.length; j++) {
      const item = texts[j];
      if (item) langDict[typeof item === "string" ? j : (item.for ?? j)] = item;
    }
  }

  let auto_romanized = false;
  const translitArr = toArray(metadata?.iTunesMetadata?.transliterations?.transliteration);
  const defaultTranslitLang = metadata?.iTunesMetadata?.transliterations?.["xml:lang"] || "en-US";

  for (let i = 0; i < translitArr.length; i++) {
    const t = translitArr[i];
    if (!t) continue;
    if (t.automaticallyCreated === "true") auto_romanized = true;

    const lang = t["xml:lang"] || defaultTranslitLang;
    const langDict = (transliterations[lang] ??= {});

    const texts = toArray(t.text);
    for (let j = 0; j < texts.length; j++) {
      const item = texts[j];
      if (item) langDict[typeof item === "string" ? j : (item.for ?? j)] = item;
    }
  }

  const transLangs = Object.keys(translations);
  const romanLangs = Object.keys(transliterations);

  const songwriters = extractSongwriters(metadata);
  const agentsData = extractAgents(metadata);

  const foundAgents = new Set<string>();
  for (let i = 0; i < agentsData.list.length; i++) {
    if (agentsData.list[i]?.id) foundAgents.add(agentsData.list[i]!.id);
  }
  for (let d = 0; d < divs.length; d++) {
    const div = divs[d];
    if (!div) continue;
    if (div["ttm:agent"]) foundAgents.add(div["ttm:agent"]);

    const ps = toArray(div.p);
    for (let pIdx = 0; pIdx < ps.length; pIdx++) {
      const p = ps[pIdx];
      if (p?.["ttm:agent"]) foundAgents.add(p["ttm:agent"]);
    }
  }

  const hasMultipleAgents = foundAgents.size > 1;
  const defaultAgent = hasMultipleAgents ? "v1" : null;

  const meta: TTMLLyricsMetadata = {};
  if (hasMultipleAgents) {
    meta.agents = agentsData.list;
  }
  if (transLangs.length > 0) meta.translations = transLangs;
  if (romanLangs.length > 0) {
    meta.romanizations = romanLangs;
    meta.auto_romanized = auto_romanized;
  }
  if (songwriters.length > 0) meta.song_writers = songwriters;
  const lang = ttml?.tt?.["xml:lang"];
  if (lang) meta.language = lang;

  const extractExtras = (
    key: string | undefined,
    originalText: string,
    role: "all" | "lead" | "bg" = "all",
  ) => {
    if (!key) return {};
    let translated: Record<string, string> | undefined;
    let roman: string | undefined;

    for (let i = 0; i < transLangs.length; i++) {
      const transLang = transLangs[i]!;
      const item = translations[transLang]?.[key];
      if (item) {
        const val = getTTMLTextContent(item, role).trim();
        if (val && val !== originalText) {
          if (!translated) translated = {};
          translated[transLang] = val;
        }
      }
    }

    for (let i = 0; i < romanLangs.length; i++) {
      const item = transliterations[romanLangs[i]!]?.[key];
      if (item) {
        const val = getTTMLTextContent(item, role).trim();
        if (val && val !== originalText) {
          roman = val;
        }
      }
    }

    return { translated, roman };
  };

  if (timing === "None") {
    const lines: StaticData["lines"] = [];
    for (let d = 0; d < divs.length; d++) {
      const div = divs[d];
      if (!div) continue;

      const ps = toArray(div.p);
      const psLen = ps.length;
      for (let i = 0; i < psLen; i++) {
        const p = ps[i];
        if (!p) continue;

        const text = getTTMLTextContent(p, "all").trim();
        const extras = extractExtras(
          typeof p === "string" ? undefined : p["itunes:key"],
          text,
          "all",
        );
        const lineObj: StaticData["lines"][number] = { text };
        if (extras.translated) lineObj.translated = extras.translated;
        if (extras.roman) lineObj.roman = extras.roman;
        lines.push(lineObj);
      }
    }
    return { data: { type: "static", lines }, meta };
  }

  let start = 0,
    end = 0;

  const lineParts: LineData["parts"] = [];
  const syllableParts: SyllableData["parts"] = [];
  const agentSequence: string[] = [];

  for (let d = 0; d < divs.length; d++) {
    const div = divs[d];
    if (!div) continue;

    const ps = toArray(div.p);
    const divAgent = div["ttm:agent"];
    const part = div["itunes:song-part"] || div["itunes:songPart"];

    const lineContent: LineContent[] = [];
    const syllableContent: SyllableContent[] = [];

    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      if (!p) continue;

      const agentId = hasMultipleAgents ? (p["ttm:agent"] ?? divAgent ?? defaultAgent) : null;
      if (agentId) agentSequence.push(agentId);

      if (timing === "Line") {
        const pBegin = parseTime(p.begin);
        const pEnd = parseTime(p.end);
        if (lineParts.length === 0 && lineContent.length === 0) start = pBegin;
        end = pEnd;

        const text = getTTMLTextContent(p, "all").trim();
        const extras = extractExtras(p["itunes:key"], text, "all");

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
        const key = p["itunes:key"];
        const romanLead: Record<string, Map<number, string>> = {};
        const romanBg: Record<string, Map<number, string>> = {};

        if (key && romanLangs.length > 0) {
          for (let r = 0; r < romanLangs.length; r++) {
            const item = transliterations[romanLangs[r]!]?.[key];
            if (item) {
              const leadSylMap = new Map<number, string>();
              const bgSylMap = new Map<number, string>();
              processAppleRomanNode(item, false, leadSylMap, bgSylMap);
              if (leadSylMap.size > 0) romanLead[romanLangs[r]!] = leadSylMap;
              if (bgSylMap.size > 0) romanBg[romanLangs[r]!] = bgSylMap;
            }
          }
        }

        const parsed = parseAppleSyllableLine(p, agentId, romanLead, romanBg, romanLangs);

        if (syllableParts.length === 0 && syllableContent.length === 0) start = parsed.start;
        end = parsed.end;

        const leadExtras = extractExtras(key, getTTMLTextContent(p, "lead").trim(), "lead");
        if (leadExtras.translated) parsed.lead.translated = leadExtras.translated;

        if (parsed.bg?.[0]) {
          const bgExtras = extractExtras(key, getTTMLTextContent(p, "bg").trim(), "bg");
          if (bgExtras.translated) parsed.bg[0].translated = bgExtras.translated;
        }

        syllableContent.push(parsed);
      }
    }

    if (timing === "Line" && lineContent.length > 0) {
      lineParts.push(part ? { part, content: lineContent } : { content: lineContent });
    } else if (timing !== "Line" && syllableContent.length > 0) {
      syllableParts.push(part ? { part, content: syllableContent } : { content: syllableContent });
    }
  }

  const tracker = new DuetTracker(agentSequence, agentsData.map);

  if (timing === "Line") {
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

  if (timing === "Line") {
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
