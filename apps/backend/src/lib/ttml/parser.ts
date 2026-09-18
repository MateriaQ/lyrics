import { XMLParser } from "fast-xml-parser";
import {
  type ParseOptions,
  type ParseResult,
  type TTMLRoot,
  type TTMLP,
  type TTMLSpan,
  toArray,
} from "@/lib/ttml/parse/utils";
import { parseApple } from "@/lib/ttml/parse/apple";
import { parseAmll } from "@/lib/ttml/parse/amll";

const SPAN_FIX_REGEX = /<\/span>(\s+)<span/g;

const parser = new XMLParser({
  attributeNamePrefix: "",
  ignoreAttributes: false,
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: false,
  ignoreDeclaration: true,
  ignorePiTags: true,
});

export function parse(ttml: string, options: ParseOptions = { mode: "apple" }): ParseResult {
  let parsed: TTMLRoot;

  try {
    const cleanTtml = ttml.replace(SPAN_FIX_REGEX, "$1</span><span");
    parsed = parser.parse(cleanTtml) as TTMLRoot;
  } catch (e) {
    return {
      success: false,
      error: `Invalid XML: ${e instanceof Error ? e.message : "Unknown error"}`,
    };
  }

  const tt = parsed?.tt;
  if (!tt) return { success: false, error: "Missing root <tt> element" };
  if (!tt.body) return { success: false, error: "Missing <body> element" };

  const divs = toArray(tt.body.div);
  if (divs.length === 0) return { success: false, error: "Missing <div> elements in body" };

  let hasContent = false;
  let hasLineTiming = false;
  let hasWordTiming = false;

  for (let i = 0; i < divs.length; i++) {
    const ps = toArray(divs[i]?.p);
    if (ps.length > 0) hasContent = true;

    for (let j = 0; j < ps.length; j++) {
      const p = ps[j];
      if (!p) continue;

      if (p.begin !== undefined || p.end !== undefined) {
        hasLineTiming = true;
      }

      if (!hasWordTiming && hasSpanTime(p)) {
        hasWordTiming = true;
      }
    }
  }

  if (!hasContent) return { success: false, error: "Missing <p> elements in body" };

  let timing = tt["itunes:timing"] || tt["composer:timing"];

  const isValidTiming =
    timing === "None" || timing === "Line" || timing === "Word" || timing === "Syllable";

  if (!timing || !isValidTiming) {
    if (hasWordTiming) {
      timing = "Word";
    } else if (hasLineTiming) {
      timing = "Line";
    } else {
      timing = "None";
    }
  }

  try {
    if (options.mode === "amll") return { success: true, ...parseAmll(parsed, timing) };
    return { success: true, ...parseApple(parsed, timing) };
  } catch (e) {
    return {
      success: false,
      error: `Format parsing error (${options.mode}): ${e instanceof Error ? e.message : "Unknown error"}`,
    };
  }
}

export type { ParseResult, ParseOptions } from "@/lib/ttml/parse/utils";

function hasSpanTime(node: TTMLP | TTMLSpan | undefined | null): boolean {
  if (!node) return false;
  if (node.span) {
    const spans = toArray(node.span);
    for (let i = 0; i < spans.length; i++) {
      const s = spans[i];
      if (!s) continue;
      if (s.begin !== undefined || s.end !== undefined) return true;
      if (hasSpanTime(s)) return true;
    }
  }
  return false;
}
