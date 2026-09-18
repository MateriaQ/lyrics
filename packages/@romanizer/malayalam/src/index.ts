import { MAP_KEYS, MALAYALAM_MAP, VOWEL_SIGNS, CONSONANTS } from "~/map";

export function romanizeMalayalam(text: string) {
  const normalizedText = text.normalize("NFC");
  const words = normalizedText.split(" ");
  const result: string[] = [];

  for (const word of words) {
    result.push(_toRoman(word));
  }

  return result.join(" ");
}
export { romanizeMalayalam as romanize, romanizeMalayalam as default };

function _toRoman(text: string): string {
  let result = "";
  let i = 0;

  while (i < text.length) {
    let matchFound = false;

    for (const key of MAP_KEYS) {
      if (text.startsWith(key, i)) {
        const mappedChar = MALAYALAM_MAP[key];
        const nextChar = text[i + key.length] || "";
        const isConsonant = CONSONANTS.has(key);
        const isFollowedByVowel = VOWEL_SIGNS.has(nextChar);
        const isFollowedByHalant = nextChar === "്";

        if (isConsonant) {
          if (!isFollowedByVowel && !isFollowedByHalant) {
            result += `${mappedChar}a`;
          } else {
            result += mappedChar;
          }
        } else {
          result += mappedChar;
        }

        i += key.length;
        matchFound = true;
        break;
      }
    }

    if (!matchFound) {
      result += text[i];
      i++;
    }
  }

  return result;
}
