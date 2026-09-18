import { describe, expect, it } from "vitest";
import { Value } from "@sinclair/typebox/value";
import { PROVIDERS_INFO } from "@/provider/constants";
import { ProviderInfoSchema, ProviderInfoMapSchema } from "@/provider/schema";

describe("PROVIDERS_INFO", () => {
  it("exposes the supported providers", () => {
    const ids = Object.values(PROVIDERS_INFO).map((p) => p.id);
    expect(ids).toEqual(["spicy", "amll", "cider", "spotify", "apple", "musixmatch"]);
  });

  it("satisfies the ProviderInfoMap schema", () => {
    expect(Value.Check(ProviderInfoMapSchema, PROVIDERS_INFO)).toBe(true);
  });
});

describe("ProviderInfoSchema", () => {
  it("accepts a valid provider info object", () => {
    expect(
      Value.Check(ProviderInfoSchema, {
        name: "Spotify",
        id: "spotify",
        url: "https://spotify.com",
      }),
    ).toBe(true);
  });

  it("rejects an unknown provider id", () => {
    expect(
      Value.Check(ProviderInfoSchema, {
        name: "Nope",
        id: "bogus",
      }),
    ).toBe(false);
  });
});
