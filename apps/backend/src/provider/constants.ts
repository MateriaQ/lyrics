import type { ProviderInfoMap } from "@/provider/types";

export const PROVIDERS_INFO = {
  spicy: {
    id: "spicy",
    name: "Spicy Lyrics",
    url: "http://spicylyrics.org",
  },
  amll: {
    id: "amll",
    name: "Apple Music Like Lyrics",
    url: "https://amll.dev",
  },
  cider: {
    id: "cider",
    name: "Cider Collective",
    url: "http://cider.sh",
  },
  // lrclib: {
  //   id: "lrclib",
  //   name: "LRCLIB",
  //   url: "https://lrclib.net",
  // },
  spotify: {
    id: "spotify",
    name: "Spotify",
    url: "https://spotify.com",
  },
  apple: {
    id: "apple",
    name: "Apple Music",
    url: "https://music.apple.com",
  },
  musixmatch: {
    id: "musixmatch",
    name: "Musixmatch",
    url: "https://www.musixmatch.com",
  },
} as const satisfies Readonly<ProviderInfoMap>;
