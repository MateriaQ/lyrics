import env from "@/env";
import redis from "@/db/redis";
import { logger } from "@/logger";
import type { Token } from "@/lib/spotify/types";

const TOKEN_REDIS_KEY = "spotify:access_token";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

let cacheToken: string | null = null;
let cacheExpiresIn: number = 0;
export async function getAccessToken(
  clientId: string = env.SPOTIFY_CLIENT_ID,
  clientSecret: string = env.SPOTIFY_CLIENT_SECRET,
): Promise<string> {
  const now = Date.now();
  if (cacheToken && now < cacheExpiresIn) {
    return cacheToken;
  }

  try {
    const res = await redis.get(TOKEN_REDIS_KEY);
    if (res) {
      return res;
    }
  } catch (err) {
    logger.error(err, "Failed to get spotify access token from redis");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    signal: AbortSignal.timeout(env.FETCH_TIMEOUT),
  });

  if (!res.ok) {
    throw new Error(`Spotify Auth Error: ${res.status} ${res.statusText}`, { cause: res });
  }

  const data = (await res.json()) as Token;
  const exp = Math.max(0, data.expires_in - 60);
  const token = data.access_token;

  cacheToken = token;
  cacheExpiresIn = exp * 1000; // in ms;

  try {
    await redis.setex(TOKEN_REDIS_KEY, exp, data.access_token);
  } catch (err) {
    logger.error(err, "Failed to set spotify access token to redis");
  }

  return token;
}
