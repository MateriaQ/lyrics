import { describe, expect, it, vi } from "vitest";
import { t } from "elysia";
import { Value } from "@sinclair/typebox/value";
import { createEnv, TypeBoxDecodeEnvError } from "@/utils/env";

const sampleSchema = t.Object({
  NAME: t.String(),
  PORT: t.Numeric({ default: 3000 }),
  ENABLED: t
    .Transform(t.String({ default: "false" }))
    .Decode((v: string) => v === "true")
    .Encode((v: boolean) => String(v)),
  TAG: t.Optional(t.String()),
});

describe("createEnv", () => {
  describe("valid source", () => {
    it("applies defaults and decodes transforms", () => {
      const env = createEnv(sampleSchema, { NAME: "svc" });

      expect(env).toEqual({
        NAME: "svc",
        PORT: 3000,
        ENABLED: false,
        TAG: undefined,
      });
    });

    it("decodes transformed string values", () => {
      const env = createEnv(sampleSchema, { NAME: "svc", ENABLED: "true" });

      expect(env.ENABLED).toBe(true);
    });

    it("converts numeric strings via Value.Convert", () => {
      const env = createEnv(sampleSchema, { NAME: "svc", PORT: "8080" });

      expect(env.PORT).toBe(8080);
    });

    it("propagates provided optional values", () => {
      const env = createEnv(sampleSchema, { NAME: "svc", TAG: "prod" });

      expect(env.TAG).toBe("prod");
    });

    it("cleans unrelated keys out of the result", () => {
      const env = createEnv(sampleSchema, { NAME: "svc", UNRELATED: "x", ANOTHER: "y" });

      expect(env).not.toHaveProperty("UNRELATED");
      expect(env).not.toHaveProperty("ANOTHER");
    });
  });

  describe("invalid source", () => {
    it("throws TypeBoxDecodeEnvError and prints a formatted error", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit called");
      });

      let thrown: unknown;
      try {
        createEnv(sampleSchema, {});
      } catch (err) {
        thrown = err;
      }
      expect(thrown).toBeInstanceOf(TypeBoxDecodeEnvError);

      const output = errorSpy.mock.calls.map(([msg]) => String(msg)).join("\n");
      expect(output).toContain("Configuration is not valid");
      expect(output).toContain("NAME");
      expect(output).toContain("Expected required property");
    });

    it("reports every invalid field", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const schema = t.Object({ A: t.String(), B: t.String(), C: t.String() });

      expect(() => createEnv(schema, {})).toThrow();

      const output = errorSpy.mock.calls.map(([msg]) => String(msg)).join("\n");
      expect(output).toContain("A");
      expect(output).toContain("B");
      expect(output).toContain("C");
      expect(output.length).toBeLessThan(1024);
    });

    it("reads from process.env when no source is provided", () => {
      const KEY = "CREATE_ENV_PROCESS_KEY";
      const schema = t.Object({ [KEY]: t.String() });

      process.env[KEY] = "abc123";
      try {
        const env = createEnv(schema);
        expect(env[KEY]).toBe("abc123");
      } finally {
        delete process.env[KEY];
      }
    });
  });
});

describe("TypeBoxDecodeEnvError", () => {
  it("wraps the original ValueError", () => {
    let thrown: unknown;
    try {
      createEnv(sampleSchema, {});
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(TypeBoxDecodeEnvError);
    expect(thrown).toHaveProperty("error");
    expect((thrown as { error: { path: string } }).error.path).toBe("/NAME");
  });
});

describe("Value.Decode interop", () => {
  it("createEnv output matches Value.Decode for the same input", () => {
    const src = { NAME: "svc", PORT: "8080", ENABLED: "true" };
    const viaCreate = createEnv(sampleSchema, src);

    let cleaned = Value.Clean(sampleSchema, { ...src });
    cleaned = Value.Convert(sampleSchema, cleaned);
    cleaned = Value.Default(sampleSchema, cleaned);
    const viaDecode = Value.Decode(sampleSchema, cleaned);

    expect(viaCreate).toEqual(viaDecode);
  });
});
