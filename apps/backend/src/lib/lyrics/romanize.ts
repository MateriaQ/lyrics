import type { SupportedLanguage } from "@/lib/language";
import { Romanizers } from "@/lib/language/romanizers";
import { containsRTL, detectLanguage } from "@/lib/language/detect";
import type { Lyrics, LyricsData, Syllable } from "@/lib/lyrics/schema";
import { logger } from "@/logger";

export type RomanizeResult<T> = {
  payload: T;
  version: number;
} & ({ success: true } | { success: false; error: string });

export const VERSION = 1;
const SPACE_OR_PUNCT_RE = /^[\s\p{P}]+$/u;

export interface EngineOptions {
  concurrency?: number;
  memoize?: boolean;
}
export function createLimiter(concurrency: number) {
  let active = 0;
  const queue: (() => void)[] = [];

  return async function limit<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= concurrency) {
      await new Promise<void>((resolve) => queue.push(resolve));
    }
    active++;
    try {
      return await fn();
    } finally {
      active--;
      if (queue.length > 0) {
        const next = queue.shift()!;
        next();
      }
    }
  };
}

export class RomanizationEngine {
  private localLangCache = new Map<string, SupportedLanguage | "unknown">();
  private romanizeCache = new Map<string, Promise<string | null>>();
  public romanizedLanguages = new Set<string>();

  private limiter: <T>(fn: () => Promise<T>) => Promise<T>;
  private memoize: boolean;

  constructor(options?: EngineOptions) {
    const concurrency = options?.concurrency ?? 8;
    this.limiter = concurrency > 0 ? createLimiter(concurrency) : (fn) => fn();
    this.memoize = options?.memoize ?? true;
  }

  public getCachedLang(text: string): SupportedLanguage | "unknown" {
    let lang = this.localLangCache.get(text);
    if (!lang) {
      lang = detectLanguage(text);
      this.localLangCache.set(text, lang);
    }
    return lang;
  }

  public async romanize(text: string, lang: SupportedLanguage | "unknown"): Promise<string | null> {
    if (!lang || lang === "unknown" || !text) return null;
    const romanizer = Romanizers[lang];
    if (!romanizer) return null;

    if (!this.memoize) {
      return await this.limiter(async () => (await romanizer(text)) ?? null);
    }

    const cacheKey = `${lang}:${text}`;
    let task = this.romanizeCache.get(cacheKey);

    if (!task) {
      task = this.limiter(async () => (await romanizer(text)) ?? null);
      this.romanizeCache.set(cacheKey, task);
    }

    return await task;
  }

  public markLanguage(lang: SupportedLanguage): void {
    this.romanizedLanguages.add(lang === "zh" ? `${lang}-Latn-pinyin` : `${lang}-Latn`);
  }

  public async processLyrics(lyric: LyricsData): Promise<void> {
    if (lyric.type === "static") {
      await Promise.all(lyric.lines.map((line) => this.processTextLine(line)));
    } else if (lyric.type === "line") {
      await Promise.all(
        lyric.parts.map(async (part) => {
          await Promise.all(part.content.map((c) => this.processTextLine(c)));
          if (part.content.some((c) => !!c.roman)) {
            for (const c of part.content) c.roman ??= c.text;
          }
        }),
      );
    } else if (lyric.type === "syllable") {
      await Promise.all(
        lyric.parts.map(async (part) => {
          const allSyllables: Syllable[] = [];
          const partPromises: Promise<void>[] = [];

          for (const content of part.content) {
            if (content.lead?.syllables) {
              allSyllables.push(...content.lead.syllables);
              partPromises.push(this.processSyllableGroup(content.lead));
            }
            if (content.bg) {
              for (const bg of content.bg) {
                if (bg.syllables) {
                  allSyllables.push(...bg.syllables);
                  partPromises.push(this.processSyllableGroup(bg));
                }
              }
            }
          }

          await Promise.all(partPromises);

          if (allSyllables.some((s) => !!s.roman)) {
            for (const s of allSyllables) s.roman ??= s.text;
          }
        }),
      );
    }
  }

  private async processTextLine(line: {
    text: string;
    rtl?: boolean;
    roman?: string;
  }): Promise<void> {
    if (containsRTL(line.text)) line.rtl = true;
    const primaryLang = this.getCachedLang(line.text);

    const tokens = line.text.split(/([\s\p{P}]+)/u).filter(Boolean);
    const chunks = this.groupTokensByLanguage(tokens, primaryLang);

    const romanizedParts = await Promise.all(
      chunks.map(async (chunk) => {
        if (chunk.lang === "unknown") return chunk.text;
        const res = await this.romanize(chunk.text, chunk.lang);
        return res || chunk.text;
      }),
    );

    let finalRomanized = "";
    let changed = false;

    for (let i = 0; i < romanizedParts.length; i++) {
      finalRomanized += romanizedParts[i];
      if (romanizedParts[i] !== chunks[i].text) {
        changed = true;
        this.markLanguage(chunks[i].lang as SupportedLanguage);
      }
    }

    if (changed && finalRomanized && finalRomanized !== line.text) {
      line.roman = finalRomanized;
    }
  }

  private async processSyllableGroup(group: {
    syllables: Syllable[];
    rtl?: boolean;
  }): Promise<void> {
    const syllables = group.syllables;
    if (!syllables?.length) return;

    const fullText = syllables.map((s) => s.text).join("");
    if (containsRTL(fullText)) group.rtl = true;

    const primaryLang = this.getCachedLang(fullText);
    const chunks: { lang: SupportedLanguage | "unknown"; syllables: Syllable[] }[] = [];

    for (const syllable of syllables) {
      let lang = this.resolveContextLang(syllable.text, primaryLang);
      if (lang === "unknown" && SPACE_OR_PUNCT_RE.test(syllable.text) && chunks.length > 0) {
        lang = chunks[chunks.length - 1].lang;
      }

      if (chunks.length > 0 && chunks[chunks.length - 1].lang === lang) {
        chunks[chunks.length - 1].syllables.push(syllable);
      } else {
        chunks.push({ lang, syllables: [syllable] });
      }
    }

    await Promise.all(
      chunks.map(async (chunk) => {
        if (chunk.lang === "unknown") return;

        const chunkText = chunk.syllables.map((s) => s.text).join("");

        let fullRomaji: string | null = null;
        let isolatedRomajis: (string | null)[] = [];

        if (chunk.syllables.length === 1) {
          fullRomaji = await this.romanize(chunkText, chunk.lang);
          isolatedRomajis = [fullRomaji];
        } else {
          [fullRomaji, ...isolatedRomajis] = await Promise.all([
            this.romanize(chunkText, chunk.lang),
            ...chunk.syllables.map((s) => this.romanize(s.text, chunk.lang)),
          ]);
        }

        const reconciled = reconcileRomanizations(chunk.syllables, isolatedRomajis, fullRomaji);

        for (let i = 0; i < chunk.syllables.length; i++) {
          const syllable = chunk.syllables[i];
          const proposed = reconciled[i] || syllable.text;

          if (proposed !== syllable.text) {
            syllable.roman = proposed;
            this.markLanguage(chunk.lang as SupportedLanguage);
          }
        }
      }),
    );
  }

  private groupTokensByLanguage(tokens: string[], primaryLang: SupportedLanguage | "unknown") {
    const chunks: { text: string; lang: SupportedLanguage | "unknown" }[] = [];

    for (const token of tokens) {
      let lang = this.resolveContextLang(token, primaryLang);
      if (lang === "unknown" && SPACE_OR_PUNCT_RE.test(token) && chunks.length > 0) {
        lang = chunks[chunks.length - 1].lang;
      }

      if (chunks.length > 0 && chunks[chunks.length - 1].lang === lang) {
        chunks[chunks.length - 1].text += token;
      } else {
        chunks.push({ lang, text: token });
      }
    }

    return chunks;
  }

  private resolveContextLang(
    token: string,
    primaryLang: SupportedLanguage | "unknown",
  ): SupportedLanguage | "unknown" {
    const cleanText = token.trim();
    if (!cleanText) return "unknown";

    const lang = this.getCachedLang(cleanText);

    if (lang === "zh" && (primaryLang === "ja" || primaryLang === "ko")) return primaryLang;

    if (lang === "ar" && (primaryLang === "ur" || primaryLang === "fa")) return primaryLang;

    return lang;
  }
}

export async function romanizeLyrics<T extends Lyrics>(
  payload: T,
  options?: EngineOptions,
): Promise<RomanizeResult<T>> {
  if (
    !payload.lyrics?.type ||
    (payload.meta.romanizations && payload.meta.romanizations.length > 0)
  ) {
    return { payload, success: true, version: VERSION };
  }

  const startTime = performance.now();
  const engine = new RomanizationEngine(options);

  try {
    await engine.processLyrics(payload.lyrics);

    if (engine.romanizedLanguages.size > 0) {
      payload.meta.auto_romanized = true;
      payload.meta.romanizations = Array.from(engine.romanizedLanguages);
    }

    logger.debug(
      {
        durationMs: performance.now() - startTime,
        hasRomanized: engine.romanizedLanguages.size > 0,
        languages: payload.meta.romanizations,
      },
      "Lyrics romanization successful",
    );

    return { payload, success: true, version: VERSION };
  } catch (err) {
    return {
      payload,
      success: false,
      error: err instanceof Error ? err.message : String(err),
      version: VERSION,
    };
  }
}

function reconcileRomanizations(
  syllables: Syllable[],
  isolatedRoms: (string | null)[],
  fullRomaji: string | null,
): string[] {
  const results = new Array<string>(syllables.length);
  const isoRawConcat = isolatedRoms.map((r) => r || "").join("");

  if (
    !fullRomaji ||
    fullRomaji.replace(/\s+/g, "").toLowerCase() === isoRawConcat.replace(/\s+/g, "").toLowerCase()
  ) {
    for (let i = 0; i < syllables.length; i++) {
      results[i] = isolatedRoms[i] || "";
    }
    return results;
  }

  let cursor = 0;
  const fullChars = fullRomaji.replace(/\s+/g, "").split("");
  const totalPhoneticLength = isolatedRoms.reduce((acc, rom) => acc + (rom ? rom.length : 1), 0);

  for (let i = 0; i < syllables.length; i++) {
    if (i === syllables.length - 1) {
      results[i] = fullChars.slice(cursor).join("");
      break;
    }

    const isolatedLength = isolatedRoms[i]?.length || 1;
    const charsToConsume = Math.max(
      1,
      Math.round((isolatedLength / totalPhoneticLength) * fullChars.length),
    );

    results[i] = fullChars.slice(cursor, cursor + charsToConsume).join("");
    cursor += charsToConsume;
  }

  return results;
}
