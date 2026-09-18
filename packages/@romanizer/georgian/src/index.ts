import { GEORGIAN_MAP } from "~/map";
function romanizeGeorgian(text: string): string {
  let result = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    result += GEORGIAN_MAP[char] !== undefined ? GEORGIAN_MAP[char] : char;
  }

  return result;
}
export { romanizeGeorgian, romanizeGeorgian as default, romanizeGeorgian as romanize };
