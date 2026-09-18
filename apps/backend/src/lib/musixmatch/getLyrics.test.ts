import { describe, expect, it } from "vitest";
import { parseMusixmatchLyrics } from "@/lib/musixmatch/getLyrics";

describe("parseMusixmatchLyrics", () => {
  it("parses synced LRC lines into a line structure", () => {
    const lrc = `[00:01.00]Hello
[00:02.00]world
[00:03.00]this is a test`;

    const result = parseMusixmatchLyrics(lrc);

    expect(result).not.toBeNull();
    if (!result || result.lyrics.type !== "line") {
      throw new Error("Expected result to be parsed as LineData");
    }

    expect(result.lyrics.start).toBe(1000);
    expect(result.lyrics.end).toBe(3000);

    const content = result.lyrics.parts[0].content;
    expect(content).toHaveLength(3);
    expect(content[0]).toMatchObject({ start: 1000, end: 2000, text: "Hello" });
    expect(content[1]).toMatchObject({ start: 2000, end: 3000, text: "world" });
    expect(content[2]).toMatchObject({ start: 3000, end: 3000, text: "this is a test" });
  });

  it("caps the last line end to the provided duration", () => {
    const lrc = `[00:01.00]Hello
[00:02.00]world`;

    const result = parseMusixmatchLyrics(lrc, 2500);

    if (!result || result.lyrics.type !== "line") {
      throw new Error("Expected result to be parsed as LineData");
    }

    const content = result.lyrics.parts[0].content;
    expect(content).toHaveLength(2);
    expect(content[1]).toMatchObject({ start: 2000, end: 2500 });
  });

  it("drops empty timed lines", () => {
    const lrc = `[00:01.00]Valid line
[00:02.00]

[00:03.00]   `;

    const result = parseMusixmatchLyrics(lrc);

    if (!result || result.lyrics.type !== "line") {
      throw new Error("Expected result to be parsed as LineData");
    }

    expect(result.lyrics.parts[0].content).toHaveLength(1);
    expect(result.lyrics.parts[0].content[0]).toMatchObject({ text: "Valid line" });
  });

  it("parses unsynced plain text into a static structure", () => {
    const plain = `Static line one
Static line two`;

    const result = parseMusixmatchLyrics(plain);

    expect(result).not.toBeNull();
    if (!result || result.lyrics.type !== "static") {
      throw new Error("Expected result to be parsed as StaticData");
    }

    expect(result.lyrics.lines).toHaveLength(2);
    expect(result.lyrics.lines[0]).toMatchObject({ text: "Static line one" });
    expect(result.lyrics.lines[1]).toMatchObject({ text: "Static line two" });
  });

  it("returns null for empty input", () => {
    expect(parseMusixmatchLyrics("")).toBeNull();
    expect(parseMusixmatchLyrics("\n\n  ")).toBeNull();
  });
});
