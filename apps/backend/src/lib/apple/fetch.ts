import env from "@/env";

export async function AppleFetch(url: string, method: "GET" | "POST" = "GET") {
  return await fetch(url, {
    method,
    headers: {
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      Origin: "https://music.apple.com",
      Authorization: `Bearer ${env.APPLE_AUTH_TOKEN}`,
      "Media-User-Token": env.APPLE_MEDIA_USER_TOKEN,
    },
    signal: AbortSignal.timeout(env.FETCH_TIMEOUT),
  });
}
