import env from "@/env";
import { AppleFetch } from "@/lib/apple/fetch";

async function getTrack(id: string) {
  const res = await AppleFetch(
    `https://api.music.apple.com/v1/catalog/${env.APPLE_STOREFRONT}/songs/${id}`,
  );

  if (!res.ok) {
    throw new Error(`Apple Music API Error: ${res.status} ${res.statusText}`, { cause: res });
  }

  return res.json();
}
