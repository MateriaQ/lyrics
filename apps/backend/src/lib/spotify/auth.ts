import env from "@/env";
import redis from "@/db/redis";

import { logger } from "@/logger";
import type { TokenData, SpotifyResult } from "@/lib/spotify/types";
import { Buffer } from "node:buffer";
import { createHmac, createHash } from "node:crypto";

const TOKEN_URL = "https://open.spotify.com/api/token";
const SECRET_KEY_URL =
  "https://github.com/xyloflake/spot-secrets-go/blob/main/secrets/secretDict.json?raw=true";
const SECRETS_CACHE_KEY = "spotify:secrets";

function getSpDcCacheKey(spDc?: string): string {
  if (!spDc) return "spotify:token:anonymous";
  const hash = createHash("sha256").update(spDc).digest("hex").slice(0, 16);
  return `spotify:token:${hash}`;
}

async function getSecret(): Promise<{ version: string; secretBytes: Buffer } | null> {
  try {
    const cached = await redis.get(SECRETS_CACHE_KEY);
    if (cached) {
      const { v, s } = JSON.parse(cached);
      return { version: v, secretBytes: Buffer.from(s, "hex") };
    }
  } catch {}

  try {
    const response = await fetch(SECRET_KEY_URL, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) return null;

    const secretsData = (await response.json()) as Record<string, number[]>;

    let latestVer = "";
    for (const key in secretsData) {
      if (!latestVer || Number(key) > Number(latestVer)) latestVer = key;
    }

    const secretInput = secretsData[latestVer];
    let str = "";
    for (let i = 0; i < secretInput.length; i++) {
      str += secretInput[i] ^ ((i % 33) + 9);
    }
    const secretBytes = Buffer.from(str, "utf-8");

    redis
      .setex(
        SECRETS_CACHE_KEY,
        86400,
        JSON.stringify({ v: latestVer, s: secretBytes.toString("hex") }),
      )
      .catch(() => {});

    return { version: latestVer, secretBytes };
  } catch {
    return null;
  }
}

type Token = {
  token: string;
  isAnonymous: boolean;
};
export async function getValidToken(spDc?: string): Promise<SpotifyResult<Token>> {
  const cacheKey = getSpDcCacheKey(spDc);

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const tokenData = JSON.parse(cached) as TokenData;
      if (tokenData.accessTokenExpirationTimestampMs > Date.now()) {
        return {
          success: true,
          data: { token: tokenData.accessToken, isAnonymous: tokenData?.isAnonymous || false },
        };
      }
    }
  } catch {}

  const secretConfig = await getSecret();
  if (!secretConfig) {
    return { success: false, code: "API_ERROR", message: "Failed to load secrets" };
  }

  const { version, secretBytes } = secretConfig;

  const counter = Math.floor(Date.now() / 30000);
  const counterBytes = Buffer.allocUnsafe(8);
  counterBytes.writeBigUInt64BE(BigInt(counter), 0);

  const hmacResult = createHmac("sha1", secretBytes).update(counterBytes).digest();

  const offset = hmacResult[19] & 0x0f;
  const binary =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);

  const totp = (binary % 1000000).toString().padStart(6, "0");

  const url = `${TOKEN_URL}?reason=init&productType=WebPlayer&totp=${totp}&totpServer=unavailable&totpVer=${version}`;

  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  };
  if (spDc) headers["Cookie"] = `sp_dc=${spDc}`;

  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(6000) });

    if (!response.ok) {
      return {
        success: false,
        code: response.status === 401 || response.status === 403 ? "AUTH_FAILED" : "API_ERROR",
        message: `Token request failed: ${response.status}`,
      };
    }

    const tokenData = (await response.json()) as TokenData;
    const ttlSeconds = Math.floor((tokenData.accessTokenExpirationTimestampMs - Date.now()) / 1000);

    if (ttlSeconds > 0) {
      redis.setex(cacheKey, ttlSeconds, JSON.stringify(tokenData)).catch(() => {});
    }

    return {
      success: true,
      data: { token: tokenData.accessToken, isAnonymous: tokenData?.isAnonymous },
    };
  } catch (error) {
    return { success: false, code: "INTERNAL_ERROR", message: String(error) };
  }
}

export async function validateSpDcToken(spDcCookie?: string): Promise<boolean> {
  try {
    const result = await getValidToken(spDcCookie);

    if (!result.success) {
      logger.warn(`sp_dc token validation failed: ${result.message}`);
      return false;
    }

    return true;
  } catch (err) {
    logger.error(err, "Failed to validate sp_dc token");
    return false;
  }
}
