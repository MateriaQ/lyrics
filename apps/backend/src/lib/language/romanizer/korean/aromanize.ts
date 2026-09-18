/**
	Aromanize-js
	@author Fajar Chandra
	@since 2017.12.06

	UNICODE TABLE REFERENCES
	Hangul Jamo            0x3131 - 0x
	Hangul Choseong Jaeum  0x1100 - 0x1112
	Hangul Jungseong Moeum 0x1161 -
	Hangul Jongseong Jaeum 0x11A8
	Hangul Eumjeol         0xAC00
*/

const TransliterationRules = {
  RevisedRomanizationTranscription: {
    cho: {
      ᄀ: "g",
      ᄁ: "kk",
      ᄂ: "n",
      ᄃ: "d",
      ᄄ: "tt",
      ᄅ: "r",
      ᄆ: "m",
      ᄇ: "b",
      ᄈ: "pp",
      ᄉ: "s",
      ᄊ: "ss",
      ᄋ: "",
      ᄌ: "j",
      ᄍ: "jj",
      ᄎ: "ch",
      ᄏ: "k",
      ᄐ: "t",
      ᄑ: "p",
      ᄒ: "h",
    },

    cho2: undefined,

    jung: {
      ᅡ: "a",
      ᅢ: "ae",
      ᅣ: "ya",
      ᅤ: "yae",
      ᅥ: "eo",
      ᅦ: "e",
      ᅧ: "yeo",
      ᅨ: "ye",
      ᅩ: "o",
      ᅪ: "wa",
      ᅫ: "wae",
      ᅬ: "oe",
      ᅭ: "yo",
      ᅮ: "u",
      ᅯ: "wo",
      ᅰ: "we",
      ᅱ: "wi",
      ᅲ: "yu",
      ᅳ: "eu",
      ᅴ: "eui",
      ᅵ: "i",
    },

    jong: {
      ᆨ: "k",
      ᆨᄂ: "ngn",
      ᆨᄅ: "ngn",
      ᆨᄆ: "ngm",
      ᆨᄋ: "g",
      ᆨᄒ: "kh",
      ᆩ: "kk",
      ᆩᄂ: "ngn",
      ᆩᄅ: "ngn",
      ᆩᄆ: "ngm",
      ᆩᄋ: "kg",
      ᆩᄒ: "kh",
      ᆪ: "k",
      ᆪᄂ: "ngn",
      ᆪᄅ: "ngn",
      ᆪᄆ: "ngm",
      ᆪᄋ: "ks",
      ᆪᄒ: "kch",
      ᆫ: "n",
      ᆫᄅ: "ll",
      ᆬ: "n",
      ᆬᄂ: "nn",
      ᆬᄅ: "nn",
      ᆬᄆ: "nm",
      ᆬᄋ: "nj",
      ᆬㅎ: "nch",
      ᆭ: "n",
      ᆭᄅ: "nn",
      ᆭᄋ: "nh",
      ᆮ: "t",
      ᆮᄂ: "nn",
      ᆮᄅ: "nn",
      ᆮᄆ: "nm",
      ᆮᄋ: "d",
      ᆮᄒ: "th",
      ᆯ: "l",
      ᆯᄂ: "ll",
      ᆯᄋ: "r",
      ᆰ: "k",
      ᆰᄂ: "ngn",
      ᆰᄅ: "ngn",
      ᆰᄆ: "ngm",
      ᆰᄋ: "lg",
      ᆰᄒ: "lkh",
      ᆱ: "m",
      ᆱᄂ: "mn",
      ᆱᄅ: "mn",
      ᆱᄆ: "mm",
      ᆱᄋ: "lm",
      ᆱᄒ: "lmh",
      ᆲ: "p",
      ᆲᄂ: "mn",
      ᆲᄅ: "mn",
      ᆲᄆ: "mm",
      ᆲᄋ: "lb",
      ᆲᄒ: "lph",
      ᆳ: "t",
      ᆳᄂ: "nn",
      ᆳᄅ: "nn",
      ᆳᄆ: "nm",
      ᆳᄋ: "ls",
      ᆳᄒ: "lsh",
      ᆴ: "t",
      ᆴᄂ: "nn",
      ᆴᄅ: "nn",
      ᆴᄆ: "nm",
      ᆴᄋ: "lt",
      ᆴᄒ: "lth",
      ᆵ: "p",
      ᆵᄂ: "mn",
      ᆵᄅ: "mn",
      ᆵᄆ: "mm",
      ᆵᄋ: "lp",
      ᆵᄒ: "lph",
      ᆶ: "l",
      ᆶᄂ: "ll",
      ᆶᄅ: "ll",
      ᆶᄆ: "lm",
      ᆶᄋ: "lh",
      ᆶᄒ: "lh",
      ᆷ: "m",
      ᆷᄅ: "mn",
      ᆸ: "p",
      ᆸᄂ: "mn",
      ᆸᄅ: "mn",
      ᆸᄆ: "mm",
      ᆸᄋ: "b",
      ᆸᄒ: "ph",
      ᆹ: "p",
      ᆹᄂ: "mn",
      ᆹᄅ: "mn",
      ᆹᄆ: "mm",
      ᆹᄋ: "ps",
      ᆹᄒ: "psh",
      ᆺ: "t",
      ᆺᄂ: "nn",
      ᆺᄅ: "nn",
      ᆺᄆ: "nm",
      ᆺᄋ: "s",
      ᆺᄒ: "sh",
      ᆻ: "t",
      ᆻᄂ: "tn",
      ᆻᄅ: "tn",
      ᆻᄆ: "nm",
      ᆻᄋ: "ss",
      ᆻᄒ: "th",
      ᆼ: "ng",
      ᆽ: "t",
      ᆽᄂ: "nn",
      ᆽᄅ: "nn",
      ᆽᄆ: "nm",
      ᆽᄋ: "j",
      ᆽᄒ: "ch",
      ᆾ: "t",
      ᆾᄂ: "nn",
      ᆾᄅ: "nn",
      ᆾᄆ: "nm",
      ᆾᄋ: "ch",
      ᆾᄒ: "ch",
      ᆿ: "k",
      ᆿᄂ: "ngn",
      ᆿᄅ: "ngn",
      ᆿᄆ: "ngm",
      ᆿᄋ: "k",
      ᆿᄒ: "kh",
      ᇀ: "t",
      ᇀᄂ: "nn",
      ᇀᄅ: "nn",
      ᇀᄆ: "nm",
      ᇀᄋ: "t",
      ᇀᄒ: "th",
      ᇁ: "p",
      ᇁᄂ: "mn",
      ᇁᄅ: "mn",
      ᇁᄆ: "mm",
      ᇁᄋ: "p",
      ᇁᄒ: "ph",
      ᇂ: "t",
      ᇂᄂ: "nn",
      ᇂᄅ: "nn",
      ᇂᄆ: "mm",
      ᇂᄋ: "h",
      ᇂᄒ: "t",
    },
  },

  RevisedRomanizationTransliteration: {
    cho: {
      ᄀ: "g",
      ᄁ: "kk",
      ᄂ: "n",
      ᄃ: "d",
      ᄄ: "tt",
      ᄅ: "l",
      ᄆ: "m",
      ᄇ: "b",
      ᄈ: "pp",
      ᄉ: "s",
      ᄊ: "ss",
      ᄋ: "",
      ᄌ: "j",
      ᄍ: "jj",
      ᄎ: "ch",
      ᄏ: "k",
      ᄐ: "t",
      ᄑ: "p",
      ᄒ: "h",
    },

    cho2: undefined,

    jung: {
      ᅡ: "a",
      ᅢ: "ae",
      ᅣ: "ya",
      ᅤ: "yae",
      ᅥ: "eo",
      ᅦ: "e",
      ᅧ: "yeo",
      ᅨ: "ye",
      ᅩ: "o",
      ᅪ: "oa",
      ᅫ: "oae",
      ᅬ: "oi",
      ᅭ: "yo",
      ᅮ: "u",
      ᅯ: "ueo",
      ᅰ: "ue",
      ᅱ: "ui",
      ᅲ: "yu",
      ᅳ: "eu",
      ᅴ: "eui",
      ᅵ: "i",
    },

    jong: {
      ᆨ: "g",
      ᆨᄋ: "g-",
      ᆩ: "kk",
      ᆩᄋ: "kk-",
      ᆪ: "gs",
      ᆪᄉ: "gs-s",
      ᆪᄋ: "gs-",
      ᆫ: "n",
      ᆫᄋ: "n-",
      ᆬ: "nj",
      ᆬᄋ: "nj-",
      ᆬᄌ: "nj-j",
      ᆭ: "nh",
      ᆭᄋ: "nh-",
      ᆮ: "d",
      ᆮᄋ: "d-",
      ᆯ: "l",
      ᆯᄋ: "l-",
      ᆰ: "lg",
      ᆰᄋ: "lg-",
      ᆱ: "lm",
      ᆱᄋ: "lm-",
      ᆲ: "lb",
      ᆲᄋ: "lb-",
      ᆳ: "ls",
      ᆳᄉ: "ls-s",
      ᆳᄋ: "ls-",
      ᆴ: "lt",
      ᆴᄋ: "lt-",
      ᆵ: "lp",
      ᆵᄋ: "lp-",
      ᆶ: "lh",
      ᆶᄋ: "lh-",
      ᆷ: "m",
      ᆷᄋ: "m-",
      ᆸ: "b",
      ᆸᄋ: "b-",
      ᆹ: "bs",
      ᆹᄉ: "bs-s",
      ᆹᄋ: "bs-",
      ᆺ: "s",
      ᆺᄊ: "s-ss",
      ᆺᄋ: "s-",
      ᆻ: "ss",
      ᆻᄉ: "ss-s",
      ᆻᄋ: "ss-",
      ᆼ: "ng",
      ᆼᄋ: "ng-",
      ᆽ: "j",
      ᆽᄋ: "j-",
      ᆽᄌ: "j-j",
      ᆾ: "ch",
      ᆾᄋ: "ch-",
      ᆿ: "k",
      ᆿᄋ: "k-",
      ᇀ: "t",
      ᇀᄋ: "t-",
      ᇁ: "p",
      ᇁᄋ: "p-",
      ᇂ: "h",
      ᇂᄋ: "h-",
    },
  },

  Skats: {
    hyphen: " ",

    cho: {
      " ": "  ",
      ᄀ: "L",
      ᄁ: "LL",
      ᄂ: "F",
      ᄃ: "B",
      ᄄ: "BB",
      ᄅ: "V",
      ᄆ: "M",
      ᄇ: "W",
      ᄈ: "WW",
      ᄉ: "G",
      ᄊ: "GG",
      ᄋ: "K",
      ᄌ: "P",
      ᄍ: "PP",
      ᄎ: "C",
      ᄏ: "X",
      ᄐ: "Z",
      ᄑ: "O",
      ᄒ: "J",
    },

    cho2: undefined,

    jung: {
      ᅡ: "E",
      ᅢ: "EU",
      ᅣ: "I",
      ᅤ: "IU",
      ᅥ: "T",
      ᅦ: "TU",
      ᅧ: "S",
      ᅨ: "SU",
      ᅩ: "A",
      ᅪ: "AE",
      ᅫ: "AEU",
      ᅬ: "AU",
      ᅭ: "N",
      ᅮ: "H",
      ᅯ: "HT",
      ᅰ: "HTU",
      ᅱ: "HU",
      ᅲ: "R",
      ᅳ: "D",
      ᅴ: "DU",
      ᅵ: "U",
    },

    jong: {
      ᆨ: "L",
      ᆩ: "LL",
      ᆪ: "LG",
      ᆫ: "F",
      ᆬ: "FP",
      ᆭ: "FJ",
      ᆮ: "B",
      ᆯ: "V",
      ᆰ: "VL",
      ᆱ: "VM",
      ᆲ: "VW",
      ᆳ: "VG",
      ᆴ: "VZ",
      ᆵ: "VO",
      ᆶ: "VJ",
      ᆷ: "M",
      ᆸ: "W",
      ᆹ: "WG",
      ᆺ: "G",
      ᆻ: "GG",
      ᆼ: "K",
      ᆽ: "P",
      ᆾ: "C",
      ᆿ: "X",
      ᇀ: "Z",
      ᇁ: "O",
      ᇂ: "J",
    },
  },

  IndonesionTranscription: {
    cho: {
      ᄀ: "gh",
      ᄁ: "k",
      ᄂ: "n",
      ᄃ: "dh",
      ᄄ: "t",
      ᄅ: "r",
      ᄆ: "m",
      ᄇ: "bh",
      ᄈ: "p",
      ᄉ: "s",
      ᄊ: "s",
      ᄋ: "",
      ᄌ: "jh",
      ᄍ: "c",
      ᄎ: "ch",
      ᄏ: "kh",
      ᄐ: "th",
      ᄑ: "ph",
      ᄒ: "h",
    },
    cho2: {
      ᄀ: "g",
      ᄁ: "k",
      ᄂ: "n",
      ᄃ: "d",
      ᄄ: "t",
      ᄅ: "r",
      ᄆ: "m",
      ᄇ: "b",
      ᄈ: "p",
      ᄉ: "s",
      ᄊ: "s",
      ᄋ: "",
      ᄌ: "j",
      ᄍ: "c",
      ᄎ: "ch",
      ᄏ: "kh",
      ᄐ: "th",
      ᄑ: "ph",
      ᄒ: "h",
    },

    jung: {
      ᅡ: "a",
      ᅢ: "è",
      ᅣ: "ya",
      ᅤ: "yè",
      ᅥ: "ö",
      ᅦ: "é",
      ᅧ: "yö",
      ᅨ: "yé",
      ᅩ: "o",
      ᅪ: "wa",
      ᅫ: "wè",
      ᅬ: "wé",
      ᅭ: "yo",
      ᅮ: "u",
      ᅯ: "wo",
      ᅰ: "wé",
      ᅱ: "wi",
      ᅲ: "yu",
      ᅳ: "eu",
      ᅴ: "eui",
      ᅵ: "i",
    },

    // Note: ᆨ (0x11A8) for last jaeum (batchim) is different than ᄀ (0x1100) for first jaeum
    // also different than ㄱ (0x3131) for standalone jamo
    jong: {
      ᆨ: "k",
      ᆨᄂ: "ngn",
      ᆨᄅ: "ngn",
      ᆨᄆ: "ngm",
      ᆨᄋ: "g",
      ᆨᄒ: "kh",
      ᆩ: "k",
      ᆩᄂ: "ngn",
      ᆩᄅ: "ngn",
      ᆩᄆ: "ngm",
      ᆩᄋ: "kg",
      ᆩᄒ: "kh",
      ᆪ: "k",
      ᆪᄂ: "ngn",
      ᆪᄅ: "ngn",
      ᆪᄆ: "ngm",
      ᆪᄋ: "ks",
      ᆪᄒ: "kch",
      ᆫ: "n",
      ᆫᄅ: "ll",
      ᆬ: "n",
      ᆬᄂ: "nn",
      ᆬᄅ: "nn",
      ᆬᄆ: "nm",
      ᆬᄋ: "nj",
      ᆬㅎ: "nch",
      ᆭ: "n",
      ᆭᄅ: "nn",
      ᆭᄋ: "nh",
      ᆮ: "t",
      ᆮᄂ: "nn",
      ᆮᄅ: "nn",
      ᆮᄆ: "nm",
      ᆮᄋ: "d",
      ᆮᄒ: "th",
      ᆯ: "l",
      ᆯᄂ: "ll",
      ᆯᄋ: "r",
      ᆰ: "k",
      ᆰᄂ: "ngn",
      ᆰᄅ: "ngn",
      ᆰᄆ: "ngm",
      ᆰᄋ: "lg",
      ᆰᄒ: "lkh",
      ᆱ: "m",
      ᆱᄂ: "mn",
      ᆱᄅ: "mn",
      ᆱᄆ: "mm",
      ᆱᄋ: "lm",
      ᆱᄒ: "lmh",
      ᆲ: "p",
      ᆲᄂ: "mn",
      ᆲᄅ: "mn",
      ᆲᄆ: "mm",
      ᆲᄋ: "lb",
      ᆲᄒ: "lph",
      ᆳ: "t",
      ᆳᄂ: "nn",
      ᆳᄅ: "nn",
      ᆳᄆ: "nm",
      ᆳᄋ: "ls",
      ᆳᄒ: "lsh",
      ᆴ: "t",
      ᆴᄂ: "nn",
      ᆴᄅ: "nn",
      ᆴᄆ: "nm",
      ᆴᄋ: "lt",
      ᆴᄒ: "lth",
      ᆵ: "p",
      ᆵᄂ: "mn",
      ᆵᄅ: "mn",
      ᆵᄆ: "mm",
      ᆵᄋ: "lp",
      ᆵᄒ: "lph",
      ᆶ: "l",
      ᆶᄂ: "ll",
      ᆶᄅ: "ll",
      ᆶᄆ: "lm",
      ᆶᄋ: "lh",
      ᆶᄒ: "lh",
      ᆷ: "m",
      ᆷᄅ: "mn",
      ᆸ: "p",
      ᆸᄂ: "mn",
      ᆸᄅ: "mn",
      ᆸᄆ: "mm",
      ᆸᄋ: "b",
      ᆸᄒ: "ph",
      ᆹ: "p",
      ᆹᄂ: "mn",
      ᆹᄅ: "mn",
      ᆹᄆ: "mm",
      ᆹᄋ: "ps",
      ᆹᄒ: "psh",
      ᆺ: "t",
      ᆺᄂ: "nn",
      ᆺᄅ: "nn",
      ᆺᄆ: "nm",
      ᆺᄋ: "sh",
      ᆺᄒ: "sh",
      ᆻ: "t",
      ᆻᄂ: "nn",
      ᆻᄅ: "nn",
      ᆻᄆ: "nm",
      ᆻᄋ: "s",
      ᆻᄒ: "th",
      ᆼ: "ng",
      ᆽ: "t",
      ᆽᄂ: "nn",
      ᆽᄅ: "nn",
      ᆽᄆ: "nm",
      ᆽᄋ: "j",
      ᆽᄒ: "ch",
      ᆾ: "t",
      ᆾᄂ: "nn",
      ᆾᄅ: "nn",
      ᆾᄆ: "nm",
      ᆾᄋ: "ch",
      ᆾᄒ: "ch",
      ᆿ: "k",
      ᆿᄂ: "ngn",
      ᆿᄅ: "ngn",
      ᆿᄆ: "ngm",
      ᆿᄋ: "k",
      ᆿᄒ: "kh",
      ᇀ: "t",
      ᇀᄂ: "nn",
      ᇀᄅ: "nn",
      ᇀᄆ: "nm",
      ᇀᄋ: "t",
      ᇀ이: "ch",
      ᇀᄒ: "th",
      ᇁ: "p",
      ᇁᄂ: "mn",
      ᇁᄅ: "mn",
      ᇁᄆ: "mm",
      ᇁᄋ: "p",
      ᇁᄒ: "ph",
      ᇂ: "t",
      ᇂᄂ: "nn",
      ᇂᄅ: "nn",
      ᇂᄆ: "mm",
      ᇂᄋ: "h",
      ᇂᄒ: "t",
    },
  },
};

const HasWhitespaceCheck = /\s/;

const IsChoseong = (character: string) =>
  character.charCodeAt(0) >= 0x1100 && character.charCodeAt(0) <= 0x1112;

export default (
  text: string,
  ruleset: keyof typeof TransliterationRules,
  syllableHyphenation: string = "",
) => {
  const rules = TransliterationRules[ruleset] as Record<string, Record<string, string> | undefined>;

  let composedRomanization = "";
  let currentSegment: string | undefined;
  let processJaeum = true; // Indicates jaeum to be processed
  for (let index = 0; index <= text.length; index += 1) {
    // If next is hangul syllable, separate it into jamo
    // 0xAC00 is the first hangul syllable in unicode table
    // 0x1100 is the first hangul jaeum in unicode table
    // 0x1161 is the first hangul moeum in unicode table
    // 0x11A8 is the first hangul batchim in unicode table
    const nextIdx = text.charCodeAt(index) - 0xac00;
    let nextSegment: string;
    if (Number.isNaN(nextIdx) === false && nextIdx >= 0 && nextIdx <= 11171) {
      nextSegment =
        String.fromCharCode(Math.floor(nextIdx / 588) + 0x1100) +
        String.fromCharCode(Math.floor((nextIdx % 588) / 28) + 0x1161) +
        (nextIdx % 28 === 0 ? "" : String.fromCharCode((nextIdx % 28) + 0x11a7)); // Index 0 is reserved for nothing
    } else {
      nextSegment = text.charAt(index);
    }
    if (currentSegment !== undefined) {
      let piece = "";

      const currentFirstCharacter = currentSegment.charAt(0);
      if (processJaeum) {
        if (
          index > 0 &&
          HasWhitespaceCheck.test(text.charAt(index - 2)) === false &&
          rules.cho2 !== undefined &&
          rules.cho2[currentFirstCharacter] !== undefined
        ) {
          piece += rules.cho2[currentFirstCharacter];
        } else if (rules.cho![currentFirstCharacter] !== undefined) {
          piece += rules.cho![currentFirstCharacter];
        } else {
          piece += currentFirstCharacter;
        }
      } else {
        processJaeum = true;
      }

      const currentSegmentLength = currentSegment.length;
      if (currentSegmentLength > 1) {
        const currentSecondCharacter = currentSegment.charAt(1);
        if (rules.jung![currentSecondCharacter] !== undefined) {
          piece += rules.jung![currentSecondCharacter];
        } else {
          piece += currentSecondCharacter;
        }

        if (currentSegmentLength === 2) {
          if (IsChoseong(nextSegment.charAt(0))) {
            piece += " ";
          }
        } else if (currentSegmentLength > 2) {
          const currentThirdCharacter = currentSegment.charAt(2);
          const nextFirstCharacter = nextSegment.charAt(0);
          const nextSecondCharacter = nextSegment.charAt(1);
          if (
            rules.jong![currentThirdCharacter + nextFirstCharacter + nextSecondCharacter] !==
            undefined
          ) {
            piece += rules.jong![currentThirdCharacter + nextFirstCharacter + nextSecondCharacter];
            processJaeum = false;
          } else if (rules.jong![currentThirdCharacter + nextFirstCharacter] !== undefined) {
            piece += rules.jong![currentThirdCharacter + nextFirstCharacter];
            processJaeum = false;
          } else {
            const jongReplacement = rules.jong![currentThirdCharacter];
            piece += jongReplacement === undefined ? currentThirdCharacter : jongReplacement; // Unchanging sound

            if (IsChoseong(nextFirstCharacter)) {
              piece += " ";
            }
          }
        }
      }

      if (currentSegment.length > 1) {
        if (syllableHyphenation === "" && rules.hyphen !== undefined) {
          piece = piece.replace(" ", rules.hyphen as any);
        } else {
          piece = piece.replace(" ", syllableHyphenation);
          if (syllableHyphenation !== "") {
            piece = piece.replace("-", syllableHyphenation);
          }
        }
      }
      composedRomanization += piece;
    }

    currentSegment = nextSegment;
  }
  return composedRomanization;
};
