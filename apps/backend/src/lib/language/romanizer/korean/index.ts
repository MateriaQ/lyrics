import aromanize from "@/lib/language/romanizer/korean/aromanize";

async function romanizeKorean(text: string): Promise<string> {
  // TODO: Review korean romanization
  return aromanize(text, "RevisedRomanizationTransliteration");
}

export { romanizeKorean as romanize };
