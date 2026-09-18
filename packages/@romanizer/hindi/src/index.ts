import { HINDI_MAP, CONSONANTS, VOWEL_SIGNS } from "~/map";

function romanizeHindi(text: string) {
  const normalizedText = text.normalize("NFC");
  const words = normalizedText.split(" ");
  const result: string[] = [];

  for (const word of words) {
    result.push(_devanagariToRoman(word));
  }

  return result.join(" ");
}
export { romanizeHindi, romanizeHindi as romanize, romanizeHindi as default };

function _devanagariToRoman(text: string): string {
  let result = "";
  let i = 0;

  while (i < text.length) {
    let currentChar = text[i];
    let nextChar = text[i + 1] || "";
    let isNuktaPair = false;

    if (nextChar === "़") {
      const combined = currentChar + nextChar;
      if (HINDI_MAP[combined]) {
        currentChar = combined;
        isNuktaPair = true;
        nextChar = text[i + 2] || "";
      }
    }

    if (currentChar === "्") {
      i++;
      continue;
    }

    const mappedChar = HINDI_MAP[currentChar];

    if (mappedChar !== undefined) {
      const isConsonant = CONSONANTS.has(currentChar);
      const isFollowedByVowel = VOWEL_SIGNS.has(nextChar);
      const isFollowedByHalant = nextChar === "्";

      if (isConsonant) {
        const isEndOfWord = nextChar === "" || /[\s.,?!'"]/.test(nextChar);

        if (!isEndOfWord && !isFollowedByVowel && !isFollowedByHalant) {
          result += `${mappedChar}a`;
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
