export default function arabicTransliterate(
  input: string,
  useStandardLatin: boolean = true,
): string {
  if (!input) return "";

  const char = (academic: string, standard: string) => (useStandardLatin ? standard : academic);

  const arabicMap: Record<string, string> = {
    ء: char("ʾ", "'"),
    أ: char("ʾ", "'"),
    ؤ: char("ʾ", "'"),
    إ: char("ʾ", "'"),
    ئ: char("ʾ", "'"),
    ب: "b",
    ت: "t",
    ث: "th",
    ج: "j",
    ح: char("ḥ", "h"),
    خ: "kh",
    د: "d",
    ذ: "dh",
    ر: "r",
    ز: "z",
    س: "s",
    ش: "sh",
    ص: char("ṣ", "s"),
    ض: char("ḍ", "d"),
    ط: char("ṭ", "t"),
    ظ: char("ẓ", "z"),
    ع: char("ʿ", "'"),
    غ: "gh",
    ف: "f",
    ق: "q",
    ك: "k",
    ل: "l",
    م: "m",
    ن: "n",
    ه: "h",
    پ: "p",
    چ: "ch",
    ژ: "zh",
    ڤ: "v",
    گ: "g",
  };

  // Vowels & Diacritics Map
  const vowelsMap: Record<string, string> = {
    "\u064E": "a",
    "\u064F": "u",
    "\u0650": "i", // Fatha, Damma, Kasra
    "\u064B": "an",
    "\u064C": "un",
    "\u064D": "in", // Tanwin
    ا: "aa",
    "\u0670": "aa",
    آ: char("ʾā", "'aa"), // Alifs
    "\u0652": "", // Sukun (Silence)
    ى: "aa",
  };

  // Ligatures & Punctuation
  const ligatures: Record<string, string> = {
    لآ: "laa'",
    لأ: "la'",
    لإ: "li'",
    لا: "laa",
  };

  const punctuation: Record<string, string> = {
    "،": ",",
    "؛": ";",
    "؟": "?",
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
    "٪": "%",
    "۔": ".",
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9",
    "\u200c": "-", // ZWNJ
    "\u200d": "", // ZWJ
  };

  const shadda = "\u0651";
  let resultLa = "";
  let lastMappedToken = "";
  for (let i = 0; i < input.length; i++) {
    const charStr = input[i];
    if (charStr === undefined) continue;
    const nextChar = input[i + 1];
    const prevChar = input[i - 1];
    const twoCharStr = charStr + (nextChar || "");

    if ((charStr === "ا" || charStr === "ى") && prevChar === "\u064B") {
      continue; // Ignore Alif/Alif Maksura after Tanwin Fath
    }

    if (charStr === " " || charStr === "\n" || punctuation[charStr] !== undefined) {
      resultLa += punctuation[charStr] !== undefined ? punctuation[charStr] : charStr;
      lastMappedToken = "";
      continue;
    }

    if (twoCharStr === "ال") {
      const isWordStart = !prevChar || /[\s,;?.\n-]/.test(prevChar);
      if (isWordStart) {
        resultLa += "al-";
        lastMappedToken = "al-";
        i++;
        continue;
      }
    }

    if (nextChar && ligatures[twoCharStr]) {
      resultLa += ligatures[twoCharStr];
      lastMappedToken = ligatures[twoCharStr];
      i++;
      continue;
    }

    if (charStr === shadda) {
      resultLa += lastMappedToken;
      continue;
    }

    if (charStr === "ة") {
      if (!resultLa.endsWith("a")) {
        resultLa += "a";
      }
      lastMappedToken = "a";
      continue;
    }

    if (charStr === "أ" || charStr === "إ" || charStr === "ا" || charStr === "ء") {
      const isInitial = !prevChar || /[\s,;?.\n-]/.test(prevChar);
      if (isInitial) {
        const isFollowedByVowelDiacritic = nextChar === "َ" || nextChar === "ُ" || nextChar === "ِ";
        if (isFollowedByVowelDiacritic) {
          lastMappedToken = "";
          continue;
        }
        if (charStr === "ء") {
          lastMappedToken = "";
          continue;
        }
        const defaultVowel = charStr === "إ" ? "i" : "a";
        resultLa += defaultVowel;
        lastMappedToken = defaultVowel;
        continue;
      }
    }

    if (charStr === "ي" || charStr === "ی" || charStr === "ے") {
      const isWordStart = !prevChar || /[\s,;?.\n-]/.test(prevChar);
      const isFollowedByVowel =
        nextChar === "ا" ||
        nextChar === "و" ||
        nextChar === "ي" ||
        nextChar === "َ" ||
        nextChar === "ُ" ||
        nextChar === "ِ" ||
        nextChar === shadda;
      const isPrecededByFatha = prevChar === "َ";

      if (isWordStart || isFollowedByVowel || isPrecededByFatha) {
        resultLa += "y";
        lastMappedToken = "y";
      } else {
        if (resultLa.endsWith("i")) {
          resultLa += "i";
        } else {
          resultLa += "ii";
        }
        lastMappedToken = "ii";
      }
      continue;
    }

    if (charStr === "و") {
      const isWordStart = !prevChar || /[\s,;?.\n-]/.test(prevChar);
      const isFollowedByVowel =
        nextChar === "ا" ||
        nextChar === "و" ||
        nextChar === "ي" ||
        nextChar === "َ" ||
        nextChar === "ِ" ||
        nextChar === "ُ" ||
        nextChar === shadda;
      const isPrecededByFatha = prevChar === "َ";

      if (isWordStart || isFollowedByVowel || isPrecededByFatha) {
        resultLa += "w";
        lastMappedToken = "w";
      } else {
        if (resultLa.endsWith("u")) {
          resultLa += "u";
        } else {
          resultLa += "uu";
        }
        lastMappedToken = "uu";
      }
      continue;
    }

    if (arabicMap[charStr] !== undefined) {
      const mappedChar = arabicMap[charStr];
      resultLa += mappedChar;
      lastMappedToken = mappedChar;
      continue;
    }

    if (vowelsMap[charStr] !== undefined) {
      const mappedVowel = vowelsMap[charStr];
      if (mappedVowel === "an" || mappedVowel === "un" || mappedVowel === "in") {
        if (resultLa.endsWith("aa")) {
          resultLa = resultLa.slice(0, -2);
        } else if (resultLa.endsWith("a")) {
          resultLa = resultLa.slice(0, -1);
        }
        resultLa += mappedVowel;
      } else if (mappedVowel === "aa" && resultLa.endsWith("a")) {
        resultLa += "a";
      } else {
        resultLa += mappedVowel;
      }
      continue;
    }

    resultLa += charStr;
    lastMappedToken = charStr;
  }

  return resultLa;
}
