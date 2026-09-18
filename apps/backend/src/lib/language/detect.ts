const SUPPORTED_LANGUAGES = [
  "ja", // Japanese
  "ko", // Korean
  "zh", // Chinese
  "el", // Greek
  "ka", // Georgian
  "ru", // Cyrillic
  "hi", // Hindi
  "pa", // Punjabi
  "ml", // Malayalam
  "gu", // Gujarati
  "ta", // Tamil
  "te", // Telugu
  "bn", // Bengali
  "ar", // Arabic
  "he", // Hebrew
  "fa", // Persian
  "ur", // Urdu
  "hy", // Armenian
  "got", // Gothic (ISO 639-2/3)
] as const;

const RTL_LANGUAGES: readonly SupportedLanguage[] = ["ar", "he", "fa", "ur"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function detectLanguage(text: string): SupportedLanguage | "unknown" {
  if (!text) return "unknown";

  // CJK
  if (/[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/.test(text)) return "ko";
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return "ja";
  if (/\p{Script=Han}/u.test(text)) return "zh";

  // RTL`
  if (/[\u0590-\u05FF]/.test(text)) return "he";
  if (/[\u0600-\u06FF]/.test(text)) {
    // Urdu
    if (/[\u0679\u0688\u0691\u06BA\u06BE\u06C1\u06D2]/.test(text)) return "ur";
    // Persian
    if (/[\u067E\u0686\u06AF\u06CC\u06A9\u0698]/.test(text)) return "fa";
    return "ar";
  }

  // Indic
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0980-\u09ff]/.test(text)) return "bn";
  if (/[\u0a00-\u0a7f]/.test(text)) return "pa";
  if (/[\u0a80-\u0aff]/.test(text)) return "gu";
  if (/[\u0b80-\u0bff]/.test(text)) return "ta";
  if (/[\u0c00-\u0c7f]/.test(text)) return "te";
  if (/[\u0d00-\u0d7f]/.test(text)) return "ml";

  // Other Scripts
  if (
    /[\u0411\u0412\u0413\u0414\u0416\u0417\u0418\u0419\u041b\u041f\u0423\u0424\u0426\u0427\u0428\u0429\u042a\u042b\u042d\u042e\u042f\u0431\u0432\u0433\u0434\u0436\u0437\u0438\u0439\u043b\u043f\u0443\u0444\u0446\u0447\u0448\u0449\u044a\u044b\u044d\u044e\u044f\u0500-\u052F\u2DE0-\u2DFF\uA640-\uA69F]/.test(
      text,
    ) ||
    /[\u0400-\u04FF\u0500-\u052F\u2DE0-\u2DFF\uA640-\uA69F]{2,}/.test(text)
  )
    return "ru";
  if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(text)) return "el";
  if (/[\u0530-\u058F]/.test(text)) return "hy";
  if (/[\u10A0-\u10FF]/.test(text)) return "ka";
  if (/[\u{10330}-\u{1034F}]/u.test(text)) return "got";

  return "unknown";
}

export function containsRTL(text: string): boolean {
  const RTL_REGEX = /[\u0590-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return RTL_REGEX.test(text);
}

function isRTL(language: SupportedLanguage | "unknown"): boolean {
  return language !== "unknown" && RTL_LANGUAGES.includes(language as SupportedLanguage);
}
