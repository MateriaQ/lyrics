import { BENGALI_MAP, BENGALI_VOWEL_SIGNS, MAP_KEYS, BENGALI_CONSONANTS } from "~/map";

function _bengaliToRoman(text: string): string {
  let result = "";
  let i = 0;

  while (i < text.length) {
    let matchFound = false;

    for (const key of MAP_KEYS) {
      if (text.startsWith(key, i)) {
        const mappedChar = BENGALI_MAP[key];
        const nextChar = text[i + key.length] || "";

        const isConsonant = BENGALI_CONSONANTS.has(key);
        const isFollowedByVowel = BENGALI_VOWEL_SIGNS.has(nextChar);
        const isFollowedByHasanta = nextChar === "্";
        const isFollowedByNukta = nextChar === "়";

        if (isConsonant) {
          const isEndOfWord = nextChar === "" || /[\s.,?!'"]/.test(nextChar);

          if (!isFollowedByVowel && !isFollowedByHasanta && !isEndOfWord && !isFollowedByNukta) {
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

function romanizeBengali(text: string) {
  const normalizedText = text.normalize("NFC");
  const words = normalizedText.split(" ");
  const result: string[] = [];

  for (const word of words) {
    result.push(_bengaliToRoman(word));
  }

  return result.join(" ");
}

export {
  romanizeBengali as bengaliRomanization,
  romanizeBengali as romanize,
  romanizeBengali as default,
};
