import { GUJARATI_MAP, CONSONANTS, VOWEL_SIGNS } from "~/map";

function romanizeGujarati(text: string) {
  const normalizedText = text.normalize("NFC");
  const words = normalizedText.split(" ");
  const result: string[] = [];

  for (const word of words) {
    result.push(_gujaratiToRoman(word));
  }

  return result.join(" ");
}

export { romanizeGujarati, romanizeGujarati as romanize, romanizeGujarati as default };

function _gujaratiToRoman(text: string): string {
  let result = "";
  let i = 0;

  while (i < text.length) {
    const currentChar = text[i];
    const nextChar = text[i + 1] || "";

    if (currentChar === "્") {
      i++;
      continue;
    }

    const mappedChar = GUJARATI_MAP[currentChar];

    if (mappedChar !== undefined) {
      const isConsonant = CONSONANTS.has(currentChar);
      const isFollowedByVowel = VOWEL_SIGNS.has(nextChar);
      const isFollowedByHalant = nextChar === "્";

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

    i++;
  }

  return result;
}
