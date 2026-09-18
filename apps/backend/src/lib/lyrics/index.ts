import type { Provider } from "@/db/schema/lyrics";
import type { Lyrics } from "@/lib/lyrics/schema";

const PRIORITY_SCORE: Record<Lyrics["lyrics"]["type"], number> = {
  syllable: 3,
  line: 2,
  static: 1,
};

const PROVIDER_BOOST: Record<Provider, number> = {
  apple: 0.2,
  amll: 0.15,
  spicy: 0.15,
  cider: 0.15,
  spotify: 0.1,
  musixmatch: 0.05,
};

export function calculateLyricsScore(
  type: Lyrics["lyrics"]["type"],
  provider: Provider,
  isCommunity?: boolean,
): number {
  let score = PRIORITY_SCORE[type] ?? 0;
  score += PROVIDER_BOOST[provider] ?? 0;

  if (provider === "spicy") {
    if (isCommunity) {
      score += 0.5;
    } else {
      score -= 0.5;
    }
  }

  return score;
}
