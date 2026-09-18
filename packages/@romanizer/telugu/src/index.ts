import { CONSONANTS, TELUGU_MAP, VOWEL_SIGNS } from "~/map";

export function romanizeTelugu(text: string) {
  const normalizedText = text.normalize("NFC");
  const words = normalizedText.split(" ");
  const result: string[] = [];

  for (const word of words) {
    result.push(_teluguToRoman(word));
  }

  return result.join(" ");
}

export { romanizeTelugu as romanize, romanizeTelugu as default };

const VIRAMA = "్";

function _teluguToRoman(text: string): string {
  let result = "";
  let i = 0;

  while (i < text.length) {
    const currentChar = text[i];
    const nextChar = text[i + 1] || "";

    const mappedChar = TELUGU_MAP[currentChar];

    if (mappedChar !== undefined) {
      const isConsonant = CONSONANTS.has(currentChar);
      const isFollowedByVowel = VOWEL_SIGNS.has(nextChar);
      const isFollowedByVirama = nextChar === VIRAMA;

      if (isConsonant) {
        if (!isFollowedByVowel && !isFollowedByVirama) {
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
