import { describe, expect, it } from "vitest";
import { parseBearer } from "@/utils/bearer";

describe("parseBearer", () => {
  it("returns undefined for empty input", () => {
    expect(parseBearer(undefined)).toBeUndefined();
    expect(parseBearer("")).toBeUndefined();
  });

  it("strips the Bearer prefix", () => {
    expect(parseBearer("Bearer abc123")).toBe("abc123");
  });

  it("returns the value unchanged when there is no Bearer prefix", () => {
    expect(parseBearer("abc123")).toBe("abc123");
  });

  it("preserves the rest of the token exactly", () => {
    expect(parseBearer("Bearer token-with-dashes_and_underscores.123")).toBe(
      "token-with-dashes_and_underscores.123",
    );
  });
});
