import { logger } from "@/logger";
import { getValidToken } from "@/lib/spotify/auth";
import env, { getProxy } from "@/env";
import { isTest } from "@/node-env";
import type { SpicyRequestPayload, SpicyResponse } from "@/lib/spicy/types";
import { SLObjPack } from "@/lib/spicy/objpack";

let SPICY_APP_VERSION = "6.3.20";
const BASE_URL = "https://api.spicylyrics.org";

let version = SPICY_APP_VERSION;
const semverRegex =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

if (!isTest) {
  updateSpicyClientVer().catch((err) => {
    logger.error(err, "Failed to perform initial spicy lyrics version update");
  });
}

export const lyricsPacker = new SLObjPack();

export async function fetchSpicy(id: string, token?: string | null): Promise<SpicyResponse> {
  if (!token) {
    const res = await getValidToken(env.SP_DC);
    if (!res.success) {
      throw new Error("Invalid token");
    }
    token = res.data.token;
  }

  const payload = {
    queries: [
      {
        operation: "lyrics",
        variables: {
          id,
          auth: "SpicyLyrics-WebAuth",
        },
      } satisfies SpicyRequestPayload,
    ],
    client: { version },
  };
  const response = await fetch(`${BASE_URL}/query`, {
    proxy: getProxy(),
    body: JSON.stringify(payload),
    headers: {
      accept: "*/*",
      "accept-language": "en",
      "X-mode": "2",
      "content-type": "application/json",
      origin: "https://xpui.app.spotify.com",
      priority: "u=1, i",
      referer: "https://xpui.app.spotify.com/",
      "sec-ch-ua": `"Not-A.Brand";v="24", "Chromium";v="146"`,
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Linux"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "spicylyrics-version": version,
      "spicylyrics-webauth": `Bearer ${token}`,
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.7680.179 Spotify/1.2.89.539 Safari/537.36",
    },
    referrer: "https://xpui.app.spotify.com/",
    method: "POST",
    signal: AbortSignal.timeout(env.FETCH_TIMEOUT),
  });
  if (!response.ok) throw new Error(`Node ${BASE_URL} failed`);
  return (await response.json()) as SpicyResponse;
}

export async function updateSpicyClientVer(): Promise<boolean> {
  try {
    const response = await fetch("https://api.spicylyrics.org/version", {
      proxy: getProxy(),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const newVersion = (await response.text()).trim();

    if (semverRegex.test(newVersion) && newVersion !== version) {
      logger.info({ version, newVersion }, "spicy-lyrics client updated to:");
      version = newVersion;
      return true;
    }
    return false;
  } catch (err) {
    version = SPICY_APP_VERSION;
    logger.error(err, "failed to get spicy lyrics client version");
    return false;
  }
}

export { parseSpicy } from "@/lib/spicy/parser";
