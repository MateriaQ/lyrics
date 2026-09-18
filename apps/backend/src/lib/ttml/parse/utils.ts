import type { LyricsData, TTMLLyricsMetadata } from "@/lib/lyrics/schema";

export type ParseResult =
  | { success: true; data: LyricsData; meta: TTMLLyricsMetadata }
  | { success: false; error: string };

export interface ParseOptions {
  mode?: "amll" | "apple";
}

export interface TTMLSpan {
  begin?: string;
  end?: string;
  "#text"?: string;
  "ttm:role"?: string;
  "amll:empty-beat"?: string;
  "xml:lang"?: string;
  span?: TTMLSpan | TTMLSpan[];
  "itunes:key"?: string;
}

export interface TTMLP {
  begin?: string;
  end?: string;
  "#text"?: string;
  "itunes:key"?: string;
  "ttm:agent"?: string;
  "amll:empty-beat"?: string;
  span?: TTMLSpan | TTMLSpan[];
}

export interface TTMLDiv {
  begin?: string;
  end?: string;
  "itunes:song-part"?: string;
  "itunes:songPart"?: string;
  "ttm:agent"?: string;
  p?: TTMLP | TTMLP[];
}

export interface TTMLBody {
  dur?: string;
  div?: TTMLDiv | TTMLDiv[];
}

export interface TTMLMetadataAgent {
  type?: string;
  "xml:id"?: string;
  "ttm:name"?: string | { type?: string; "#text"?: string };
}

export type TTMLTextItem = string | (TTMLSpan & { for?: string });

export interface TTMLMetadata {
  "ttm:title"?: string;
  "ttm:agent"?: TTMLMetadataAgent | TTMLMetadataAgent[];
  iTunesMetadata?: {
    leadingSilence?: string;
    audio?: { lyricOffset?: string };
    translations?: {
      translation?: {
        "xml:lang"?: string;
        text?: TTMLTextItem[];
      }[];
    };
    transliterations?: {
      "xml:lang"?: string;
      transliteration?: {
        automaticallyCreated?: string;
        "xml:lang"?: string;
        text?: TTMLTextItem[];
      }[];
    };
    songwriters?: {
      songwriter?: string | { "#text"?: string } | (string | { "#text"?: string })[];
    };
  };
  "amll:meta"?:
    | { key?: string; value?: string | number }
    | { key?: string; value?: string | number }[];
}

export interface TTMLHead {
  metadata?: TTMLMetadata;
}

export interface TTML {
  xmlns?: string;
  "xmlns:itunes"?: string;
  "xmlns:ttm"?: string;
  "itunes:timing"?: string;
  "composer:timing"?: string;
  "xml:lang"?: string;
  head?: TTMLHead;
  body?: TTMLBody;
  audio?: { lyricOffset?: string };
}

export interface TTMLRoot {
  tt?: TTML;
}

export function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}
export function parseTime(timeStr: string | undefined): number {
  if (!timeStr) return 0;

  const trimmed = timeStr.trim();

  const offsetMatch = trimmed.match(/^([0-9.]+)(h|m|s|ms)$/);
  if (offsetMatch) {
    const value = parseFloat(offsetMatch[1]);
    const unit = offsetMatch[2];

    switch (unit) {
      case "h":
        return Math.round(value * 3600000);
      case "m":
        return Math.round(value * 60000);
      case "s":
        return Math.round(value * 1000);
      case "ms":
        return Math.round(value);
      default:
        return 0;
    }
  }

  const parts = trimmed.split(":");
  if (parts.length > 1) {
    let totalSeconds = 0;

    for (const part of parts) {
      totalSeconds = totalSeconds * 60 + (parseFloat(part) || 0);
    }

    return Math.round(totalSeconds * 1000);
  }

  return Math.round((parseFloat(trimmed) || 0) * 1000);
}

const BOUNDARY_END_REGEX = /[\s,.!?;:—]+$/;
const BOUNDARY_START_REGEX = /^[\s,.!?;:—]+/;

export function checkIsWordBoundary(rawText: string, nextRawText: string | null): boolean {
  if (nextRawText === null) return true;
  if (BOUNDARY_END_REGEX.test(rawText)) return true;
  if (BOUNDARY_START_REGEX.test(nextRawText)) return true;
  return false;
}

export function extractSongwriters(metadata: TTMLMetadata | undefined): string[] {
  const result: string[] = [];
  const arr = toArray(metadata?.iTunesMetadata?.songwriters?.songwriter);
  const len = arr.length;
  for (let i = 0; i < len; i++) {
    const sw = arr[i];
    const name = typeof sw === "string" ? sw : sw?.["#text"];
    if (name) result.push(name);
  }
  return result;
}

const VALID_AGENT_TYPES = new Set(["person", "group", "other"]);

export function extractAgents(metadata: TTMLMetadata | undefined): {
  map: Map<string, string>;
  list: { type: string; id: string; name?: string }[];
} {
  const map = new Map<string, string>();
  const list: { type: string; id: string; name?: string }[] = [];
  const arr = toArray(metadata?.["ttm:agent"]);
  const len = arr.length;

  for (let i = 0; i < len; i++) {
    const agent = arr[i];
    if (agent?.["xml:id"]) {
      const id = agent["xml:id"];
      let type = agent.type ?? "person";

      if (!VALID_AGENT_TYPES.has(type)) type = "other";
      map.set(id, type);

      const agentObj: { type: string; id: string; name?: string } = { type, id };
      const nameNode = agent["ttm:name"];

      if (nameNode) {
        const nameText = typeof nameNode === "string" ? nameNode : nameNode["#text"];
        if (nameText) agentObj.name = nameText;
      }

      list.push(agentObj);
    }
  }
  return { map, list };
}

export class DuetTracker {
  private duetArray: boolean[] = [];

  constructor(agentSequence: string[], agentsMap?: Map<string, string>) {
    let currentSideIsLeft = true;
    let lastPersonSingerId: string | null = null;

    let rightCount = 0;
    let totalCount = 0;

    const len = agentSequence.length;
    for (let i = 0; i < len; i++) {
      const agentId = agentSequence[i]!;
      let type = agentsMap?.get(agentId);

      if (!type) {
        if (agentId === "v1000") type = "group";
        else if (agentId === "v2000") type = "other";
        else type = "person";
      }

      let isDuet = false; // false = Primary/Left, true = Secondary/Right

      if (type === "group") {
        isDuet = false;
      } else {
        if (lastPersonSingerId === null) {
          currentSideIsLeft = type !== "other";
        } else if (agentId !== lastPersonSingerId) {
          currentSideIsLeft = !currentSideIsLeft;
        }

        isDuet = !currentSideIsLeft;
        lastPersonSingerId = agentId;
      }

      totalCount++;
      if (isDuet) rightCount++;

      this.duetArray.push(isDuet);
    }

    if (totalCount > 0 && Math.round((rightCount / totalCount) * 100) >= 85) {
      for (let i = 0; i < len; i++) {
        this.duetArray[i] = !this.duetArray[i];
      }
    }
  }

  public isDuet(index: number): boolean {
    return this.duetArray[index] ?? false;
  }
}

export interface TTMLTextNode {
  span?: TTMLSpan | TTMLSpan[];
  "#text"?: string;
  begin?: string;
  end?: string;
  for?: string;
  "ttm:role"?: string;
}

export function stripParens(text: string): string {
  if (text.indexOf("(") === -1 && text.indexOf(")") === -1) return text;
  return text.replace(/[()]/g, "");
}

export function getTTMLTextContent(
  node: string | TTMLTextNode | undefined | null,
  role: "all" | "lead" | "bg" = "all",
  isInsideBg = false,
  allowExtras = false,
): string {
  const parts: string[] = [];

  function collect(currentNode: string | TTMLTextNode | undefined | null, currentIsBg: boolean) {
    if (!currentNode) return;

    if (typeof currentNode === "string") {
      if (role === "bg" && !currentIsBg) return;
      if (role === "lead" && currentIsBg) return;
      parts.push(currentIsBg ? stripParens(currentNode) : currentNode);
      return;
    }

    const nodeRole = currentNode["ttm:role"];
    if (!allowExtras && (nodeRole === "x-translation" || nodeRole === "x-roman")) {
      return;
    }

    const nextIsBg = currentIsBg || nodeRole === "x-bg";

    if (currentNode["#text"]) {
      if (role === "all" || (role === "bg" && nextIsBg) || (role === "lead" && !nextIsBg)) {
        const content = currentNode["#text"];
        parts.push(nextIsBg ? stripParens(content) : content);
      }
    }

    if (currentNode.span) {
      const spans = toArray(currentNode.span);
      for (let i = 0; i < spans.length; i++) {
        collect(spans[i], nextIsBg);
      }
    }
  }

  collect(node, isInsideBg);
  return parts.join("");
}
