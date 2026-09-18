import { describe, expect, it } from "vitest";
import { romanize as romanizeChinese } from "@/lib/language/romanizer/chinese";

describe("Chinese romanizer", () => {
  it("romanizes Chinese characters to pinyin", () => {
    expect(romanizeChinese("你好")).toBe("ni hao");
  });

  it("returns empty string for empty input", () => {
    expect(romanizeChinese("")).toBe("");
  });
});
