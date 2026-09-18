import { describe, expect, it } from "vitest";
import {
  checkIsWordBoundary,
  DuetTracker,
  extractAgents,
  extractSongwriters,
  getTTMLTextContent,
  parseTime,
  stripParens,
  toArray,
} from "@/lib/ttml/parse/utils";

describe("toArray", () => {
  it("normalizes undefined/null/single/array to an array", () => {
    expect(toArray(undefined)).toEqual([]);
    expect(toArray(null)).toEqual([]);
    expect(toArray("a")).toEqual(["a"]);
    expect(toArray(["a", "b"])).toEqual(["a", "b"]);
  });
});

describe("parseTime", () => {
  it("parses unit suffix notation", () => {
    expect(parseTime("2h")).toBe(2 * 3600000);
    expect(parseTime("1.5m")).toBe(90000);
    expect(parseTime("2s")).toBe(2000);
    expect(parseTime("500ms")).toBe(500);
  });

  it("parses colon notation", () => {
    expect(parseTime("1:30")).toBe(90000);
    expect(parseTime("1:00:30")).toBe(3600000 + 30000);
  });

  it("parses plain seconds", () => {
    expect(parseTime("3.5")).toBe(3500);
  });

  it("returns 0 for empty/undefined", () => {
    expect(parseTime(undefined)).toBe(0);
    expect(parseTime("")).toBe(0);
  });
});

describe("checkIsWordBoundary", () => {
  it("treats null next text as a boundary", () => {
    expect(checkIsWordBoundary("hello", null)).toBe(true);
  });

  it("detects trailing/leading punctuation boundaries", () => {
    expect(checkIsWordBoundary("hello,", "world")).toBe(true);
    expect(checkIsWordBoundary("hello", " world")).toBe(true);
    expect(checkIsWordBoundary("hello", "world")).toBe(false);
  });
});

describe("extractSongwriters", () => {
  it("extracts names from string and object forms", () => {
    const meta = {
      iTunesMetadata: {
        songwriters: {
          songwriter: ["John", { "#text": "Jane" }],
        },
      },
    };
    expect(extractSongwriters(meta as never)).toEqual(["John", "Jane"]);
  });

  it("returns empty array when no songwriters", () => {
    expect(extractSongwriters(undefined)).toEqual([]);
  });
});

describe("extractAgents", () => {
  it("extracts agent map and list with validated types", () => {
    const meta = {
      "ttm:agent": [
        { "xml:id": "a1", type: "person", "ttm:name": "Alice" },
        { "xml:id": "a2", type: "bogus" },
      ],
    };
    const { map, list } = extractAgents(meta as never);
    expect(map.get("a1")).toBe("person");
    expect(map.get("a2")).toBe("other");
    expect(list).toEqual([
      { type: "person", id: "a1", name: "Alice" },
      { type: "other", id: "a2" },
    ]);
  });
});

describe("stripParens", () => {
  it("removes parentheses", () => {
    expect(stripParens("(ooh) yeah")).toBe("ooh yeah");
    expect(stripParens("no parens")).toBe("no parens");
  });
});

describe("getTTMLTextContent", () => {
  it("concatenates nested span text", () => {
    const node = { span: [{ "#text": "hel" }, { span: [{ "#text": "lo" }] }] };
    expect(getTTMLTextContent(node as never)).toBe("hello");
  });

  it("skips translation/roman spans by default", () => {
    const node = {
      span: [{ "#text": "bonjour", "ttm:role": "x-translation" }, { "#text": "hola" }],
    };
    expect(getTTMLTextContent(node as never)).toBe("hola");
  });

  it("filters to background vocals with parens stripped", () => {
    const node = {
      span: [{ "#text": "lead" }, { "#text": "(bg)", "ttm:role": "x-bg" }],
    };
    expect(getTTMLTextContent(node as never, "bg")).toBe("bg");
    expect(getTTMLTextContent(node as never, "lead")).toBe("lead");
  });
});

describe("DuetTracker", () => {
  it("marks second distinct person as secondary", () => {
    const tracker = new DuetTracker(["a1", "a2"]);
    expect(tracker.isDuet(0)).toBe(false);
    expect(tracker.isDuet(1)).toBe(true);
  });

  it("keeps group lines on the primary side", () => {
    const tracker = new DuetTracker(["group1", "a1"], new Map([["group1", "group"]]));
    expect(tracker.isDuet(0)).toBe(false);
  });
});
