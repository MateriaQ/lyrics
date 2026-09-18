import { describe, expect, it } from "vitest";
import { romanize as romanizeKorean } from "@/lib/language/romanizer/korean";

describe("Korean romanizer", () => {
  it("romanizes Hangul to revised romanization", async () => {
    const result = await romanizeKorean("안녕하세요");
    expect(result).toMatch(/annyeong/);
  });
});
