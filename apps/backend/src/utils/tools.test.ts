import { describe, expect, it } from "vitest";
import { t } from "elysia";
import { Value } from "@sinclair/typebox/value";
import { enhanceErrors, mergeErrors, formatTypeBoxPath } from "@/utils/tools";

describe("formatTypeBoxPath", () => {
  it("strips the leading slash", () => {
    expect(formatTypeBoxPath("/a")).toBe("a");
  });

  it("converts slashes to dots", () => {
    expect(formatTypeBoxPath("/a/b/c")).toBe("a.b.c");
  });

  it("leaves paths without a leading slash unchanged", () => {
    expect(formatTypeBoxPath("a/b/c")).toBe("a.b.c");
  });

  it("handles root path", () => {
    expect(formatTypeBoxPath("")).toBe("");
  });
});

describe("mergeErrors", () => {
  const schema = t.Object({ A: t.String(), B: t.Number() });
  const value = { A: undefined, B: "nan" };

  it("merges errors into one entry per path", () => {
    const merged = mergeErrors(Value.Errors(schema, value));
    const paths = merged.map((e) => e.path);

    expect(paths).toContain("/A");
    expect(paths).toContain("/B");
  });

  it("keys errors by error type", () => {
    expect(mergeErrors(Value.Errors(schema, value)).length).toBeGreaterThan(0);
    const a = mergeErrors(Value.Errors(schema, value)).find((e) => e.path === "/A");
    expect(a?.errors).toBeTypeOf("object");
  });

  it("strips empty paths when stripEmptyPaths is true", () => {
    const merged = mergeErrors(Value.Errors(t.String(), 123), true);
    expect(merged).toHaveLength(0);
  });

  it("keeps root errors when stripEmptyPaths is false or undefined", () => {
    const merged = mergeErrors(Value.Errors(t.String(), 123));
    expect(merged).toHaveLength(1);
    expect(merged[0].path).toBe("");
  });
});

describe("enhanceErrors", () => {
  it("formats paths to dot notation when formatPath is set", () => {
    const schema = t.Object({ nested: t.Object({ value: t.String() }) });
    const errors = [
      ...enhanceErrors(Value.Errors(schema, { nested: { value: 42 } }), {
        formatPath: true,
      }),
    ];
    const path = errors.find((e) => e.path.includes("value"))?.path;

    expect(path).toBe("nested.value");
  });

  it("adds a prefix to each path", () => {
    const schema = t.Object({ A: t.String() });
    const [error] = [...enhanceErrors(Value.Errors(schema, {}), { prefix: "env" })];

    expect(error.path).toBe("env./A");
  });
});

describe("enhanceErrors nullish union", () => {
  it("explodes nullable unions into their members", () => {
    const schema = t.Object({ maybe: t.Union([t.Null(), t.String()]) });
    const errors = [...enhanceErrors(Value.Errors(schema, { maybe: false }), { formatPath: true })];

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.path === "maybe")).toBe(true);
  });
});

describe("mergeErrors with enhanced errors", () => {
  it("returns string-keyed errors for enhanced input", () => {
    const schema = t.Object({ A: t.String() });
    const enhanced = enhanceErrors(Value.Errors(schema, {}));
    const merged = mergeErrors(enhanced);

    expect(merged).toHaveLength(1);
    expect(typeof merged[0].errors).toBe("object");
  });
});
