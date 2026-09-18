import { describe, it, expect } from "vitest";
import { romanize } from "@/lib/language/romanizer/japanese";

describe("Japanese Romanizer", () => {
  it("should convert basic Kanji to spaced romaji", async () => {
    const input = "こんにちは世界";
    const result = await romanize(input);

    expect(result).toContain("konnichiwa");
    expect(result).toContain("sekai");
  });

  it("should handle mixed Kanji and Kana", async () => {
    const input = "魔法少女";
    const result = await romanize(input);

    expect(result).toBe("mahō shōjo");
  });

  it("should correctly space sentences based on the mode", async () => {
    const input = "私は学生です";
    const result = await romanize(input);
    const spaces = result.trim().split(" ").length;
    expect(spaces).toBeGreaterThan(1);
  });

  it("should return an empty string when input is empty", async () => {
    const result = await romanize("");
    expect(result).toBe("");
  });

  it("should handle non-Japanese characters gracefully", async () => {
    const input = "Hello 世界";
    const result = await romanize(input);

    expect(result).toMatch(/Hello/i);
    expect(result).toContain("sekai");
  });
});
