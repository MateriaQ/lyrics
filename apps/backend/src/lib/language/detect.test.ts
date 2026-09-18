import { describe, expect, it } from "vitest";
import { containsRTL, detectLanguage } from "@/lib/language/detect";

describe("detectLanguage", () => {
  it("returns unknown for empty input", () => {
    expect(detectLanguage("")).toBe("unknown");
    expect(detectLanguage("   ")).toBe("unknown");
  });

  it("detects CJK scripts", () => {
    expect(detectLanguage("こんにちは")).toBe("ja");
    expect(detectLanguage("한국어")).toBe("ko");
    expect(detectLanguage("你好世界")).toBe("zh");
  });

  it("detects RTL scripts", () => {
    expect(detectLanguage("שלום")).toBe("he");
    expect(detectLanguage("مرحبا")).toBe("ar");
    expect(detectLanguage("سلام")).toBe("ar");
    expect(detectLanguage("پنجشبه")).toBe("fa");
    expect(detectLanguage("اردو")).toBe("ar");
    expect(detectLanguage("ہم")).toBe("ur");
  });

  it("detects Indic scripts", () => {
    expect(detectLanguage("नमस्ते")).toBe("hi");
    expect(detectLanguage("বাংলা")).toBe("bn");
    expect(detectLanguage("ਪੰਜਾਬੀ")).toBe("pa");
    expect(detectLanguage("ગુજરાતી")).toBe("gu");
    expect(detectLanguage("தமிழ்")).toBe("ta");
    expect(detectLanguage("తెలుగు")).toBe("te");
    expect(detectLanguage("മലയാളം")).toBe("ml");
  });

  it("detects other scripts", () => {
    expect(detectLanguage("Привет мир")).toBe("ru");
    expect(detectLanguage("γεια")).toBe("el");
    expect(detectLanguage("բարեւ")).toBe("hy");
    expect(detectLanguage("გამარჯობა")).toBe("ka");
    expect(detectLanguage("𐍈𐌰𐌹𐍅𐌰")).toBe("got");
  });

  it("returns unknown for latin text", () => {
    expect(detectLanguage("hello world")).toBe("unknown");
    expect(detectLanguage("42")).toBe("unknown");
  });
});

describe("containsRTL", () => {
  it("detects RTL text", () => {
    expect(containsRTL("مرحبا")).toBe(true);
    expect(containsRTL("שלום")).toBe(true);
    expect(containsRTL("hello")).toBe(false);
  });
});
