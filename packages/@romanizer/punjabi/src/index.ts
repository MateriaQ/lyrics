import { GURMUKHI_MAP, GURMUKHI_VOWEL_SIGNS, GURMUKHI_CONSONANTS } from "~/map";

export function romanizePunjabi(text: string) {
  const normalizedText = text.normalize("NFC");
  const words = normalizedText.split(" ");
  const result: string[] = [];

  for (const word of words) {
    result.push(_gurmukhiToHunterian(word));
  }

  return result.join(" ");
}

export { romanizePunjabi as default, romanizePunjabi as romanize };

const ADHAK = "ੱ";

function _gurmukhiToHunterian(text: string): string {
  let result = "";
  let i = 0;
  let doubleNext = false;

  while (i < text.length) {
    let currentChar = text[i];
    let nextChar = text[i + 1] || "";
    let isNuktaPair = false;

    if (nextChar === "\u0A3C") {
      const combined = currentChar + nextChar;
      if (GURMUKHI_MAP[combined]) {
        currentChar = combined;
        isNuktaPair = true;
        nextChar = text[i + 2] || "";
      }
    }

    if (currentChar === "੍") {
      i++;
      continue;
    }

    if (currentChar === ADHAK) {
      doubleNext = true;
      i++;
      continue;
    }

    const mappedChar = GURMUKHI_MAP[currentChar];

    if (mappedChar !== undefined) {
      const isConsonant = GURMUKHI_CONSONANTS.has(currentChar);

      const isFollowedByVowel = GURMUKHI_VOWEL_SIGNS.has(nextChar);
      const isFollowedByHalant = nextChar === "੍";

      if (doubleNext && isConsonant) {
        result += mappedChar;
        doubleNext = false;
      }

      if (isConsonant && !isFollowedByVowel && !isFollowedByHalant) {
        const isEndOfWord = nextChar === "" || /[\s.,?!'"]/.test(nextChar);

        if (!isEndOfWord) {
          result += mappedChar + "a";
        } else {
          result += mappedChar;
        }
      } else {
        result += mappedChar;
      }
    } else {
      result += currentChar;
    }

    i += isNuktaPair ? 2 : 1;
  }

  return result;
}
