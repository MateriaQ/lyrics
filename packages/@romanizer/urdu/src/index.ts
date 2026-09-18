import { URDU_CHAR_MAP, WORD_PRIORITY_MAP } from "~/maps";

const DIACRITICS_PATTERN = "[\u064B-\u065F\u0670\u06DF-\u06E1]";
const DIACRITICS_REGEX = new RegExp(DIACRITICS_PATTERN, "g");
const IS_DIACRITIC_REGEX = new RegExp(`^${DIACRITICS_PATTERN}$`);

const TOKEN_REGEX = /[\p{L}\p{M}\u200C\u200D]+|[،؟۔٪٫٬]/gu;
const PUNC_CHECK_REGEX = /[\p{L}\p{M}]/u;
const ZWJ_ZWNJ_REGEX = /[\u200C\u200D]/g;
const YEH_REGEX = /ي/g;
const KAF_REGEX = /ك/g;

const GRAPHEME_SEGMENTER = new Intl.Segmenter();

function romanizeUrdu(text: string): string {
  if (!text) return "";

  return text.normalize("NFC").replace(TOKEN_REGEX, (match) => {
    if (match.length === 1 && !PUNC_CHECK_REGEX.test(match)) {
      const charMatch = URDU_CHAR_MAP[match];
      if (charMatch !== undefined) return charMatch;
    }

    const cleanWord = match
      .replace(DIACRITICS_REGEX, "")
      .replace(ZWJ_ZWNJ_REGEX, "")
      .replace(YEH_REGEX, "ی")
      .replace(KAF_REGEX, "ک");

    const dictMatch = WORD_PRIORITY_MAP[cleanWord];
    if (dictMatch !== undefined) {
      const hasIzhafat = match.endsWith("\u0650");
      return dictMatch + (hasIzhafat ? "-e" : "");
    }

    let result = "";
    const cleanMatch = match.replace(ZWJ_ZWNJ_REGEX, "");

    const chars = Array.from(GRAPHEME_SEGMENTER.segment(cleanMatch), (s) => s.segment);
    const len = chars.length;

    const nextBaseCharIs = (startIndex: number, targetList: string[]) => {
      for (let j = startIndex; j < len; j++) {
        const nextChar = chars[j] as string;
        if (IS_DIACRITIC_REGEX.test(nextChar)) continue;
        return targetList.includes(nextChar);
      }
      return false;
    };

    let firstBaseIdx = 0;
    while (firstBaseIdx < len && IS_DIACRITIC_REGEX.test(chars[firstBaseIdx] as string)) {
      firstBaseIdx++;
    }

    let lastBaseIdx = len - 1;
    while (lastBaseIdx >= 0 && IS_DIACRITIC_REGEX.test(chars[lastBaseIdx] as string)) {
      lastBaseIdx--;
    }

    for (let i = 0; i < len; i++) {
      const char = chars[i] as string;

      if (char === "\u0650" && i >= lastBaseIdx) {
        result += "-e";
        continue;
      }

      if (char === "ی" || char === "ي") {
        if (i <= firstBaseIdx || nextBaseCharIs(i + 1, ["ا", "و"])) result += "y";
        else result += "i";
      } else if (char === "و") {
        if (i <= firstBaseIdx || nextBaseCharIs(i + 1, ["ا"])) result += "w";
        else result += "o";
      } else if (char === "ہ") {
        if (i === lastBaseIdx) result += "a";
        else result += "h";
      } else {
        const mappedChar = URDU_CHAR_MAP[char];
        result += mappedChar !== undefined ? mappedChar : char;
      }
    }

    return result;
  });
}

export { romanizeUrdu, romanizeUrdu as default, romanizeUrdu as romanize };
