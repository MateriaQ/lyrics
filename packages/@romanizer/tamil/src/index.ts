import { TAMIL_MAP, TAMIL_CONSONANTS, TAMIL_VOWEL_SIGNS } from "~/map";

export function romanizeTamil(text: string) {
  const normalizedText = text.normalize("NFC");
  const words = normalizedText.split(" ");
  const result: string[] = [];

  for (const word of words) {
    result.push(_tamilToRoman(word));
  }

  return result.join(" ");
}
export { romanizeTamil as romanize, romanizeTamil as default };

function _tamilToRoman(text: string): string {
  let result = "";
  let i = 0;

  while (i < text.length) {
    const currentChar = text[i];
    const nextChar = text[i + 1] || "";

    if (currentChar === "க" && nextChar === "்" && text[i + 2] === "ஷ") {
      result += "ksh";
      i += 3;
      continue;
    }

    const mappedChar = TAMIL_MAP[currentChar];

    if (mappedChar !== undefined) {
      const isConsonant = TAMIL_CONSONANTS.has(currentChar);
      const isFollowedByVowel = TAMIL_VOWEL_SIGNS.has(nextChar);
      const isFollowedByPulli = nextChar === "்";

      if (isConsonant) {
        if (!isFollowedByVowel && !isFollowedByPulli) {
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
