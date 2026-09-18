import { createEnv } from "@/utils/env";
import { t } from "elysia";
import pkg from "@root/package.json";
import { SEVEN_DAYS_S, SIXTEEN_DAYS_S, THIRTY_DAYS_S, THREE_DAYS_S } from "@/constants";

const SMTPServiceSchema = t.UnionEnum(["gmail", "resend", "sendinblue"], {
  default: "gmail",
});

const BearerTokenSchema = t
  .Transform(t.String({ minLength: 8 }))
  .Decode((v) => v.replace(/^Bearer\s+/i, ""))
  .Encode((v) => v);

const BasePathSchema = t
  .Transform(t.String({ default: "/api" }))
  .Decode((v) => {
    const trimmed = v.trim();
    if (!trimmed || trimmed === "/") return "";
    return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
  })
  .Encode((v) => v);

function parseProxyList(rawProxies?: string): string[] {
  if (!rawProxies || !rawProxies.trim()) return [];

  return rawProxies
    .replace(/\\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith("http://") || line.startsWith("https://")) return line;
      const parts = line.split(":");
      if (parts.length === 4) {
        const [ip, port, user, pass] = parts;
        return `http://${user}:${pass}@${ip}:${port}`;
      }
      if (parts.length === 2) {
        return `http://${line}`;
      }
      return line;
    });
}

const EnvSchema = t.Object({
  CI: t.Boolean({ default: false }),

  // App Base Prefix
  BASE_PATH: BasePathSchema,

  // Health check secret
  HEALTH_SECRET: t.String({ minLength: 32 }),

  // Auth
  AUTH_SECRET: t.String({ minLength: 32 }),
  AUTH_BASE_URL: t.String({ format: "uri" }),

  GITHUB_CLIENT_ID: t.String({ minLength: 6 }),
  GITHUB_CLIENT_SECRET: t.String({ minLength: 6 }),

  DISCORD_CLIENT_ID: t.String({ minLength: 6 }),
  DISCORD_CLIENT_SECRET: t.String({ minLength: 6 }),

  // Mail
  SMTP_PASS: t.String({ minLength: 2 }),
  SMTP_USER: t.String({ minLength: 2 }),
  SMTP_SERVICE: SMTPServiceSchema,
  ADMIN_MAIL: t.String({ minLength: 2 }),
  MAIL_FROM_ADDRESS: t.Optional(t.String({ format: "email" })),

  // Spotify
  SPOTIFY_CLIENT_ID: t.String({ minLength: 12 }),
  SPOTIFY_CLIENT_SECRET: t.String({ minLength: 12 }),

  // Apple Music
  APPLE_AUTH_TOKEN: BearerTokenSchema,
  APPLE_MEDIA_USER_TOKEN: t.String({ minLength: 12 }),
  APPLE_STOREFRONT: t.String({ default: "us", minLength: 2 }),

  // Lyrics
  SP_DC: t.Optional(t.String({ minLength: 32 })),

  // Proxies
  PROXIES: t.Optional(t.String({ default: "" })),

  // TTLs
  LYRICS_NEW_NOT_FOUND_TTL: t.Numeric({ default: THREE_DAYS_S }),
  LYRICS_NOT_FOUND_TTL: t.Numeric({ default: THIRTY_DAYS_S }),
  LYRICS_CACHE_TTL: t.Numeric({ default: SIXTEEN_DAYS_S }),
  CLIENT_CACHE_TTL: t.Numeric({ default: SEVEN_DAYS_S }),

  FETCH_TIMEOUT: t.Numeric({ default: 12000 }),
  STORE_ALL_LYRICS: t.Boolean({ default: true }),

  // Server
  EMAIL_BASE_URL: t.String({ format: "uri" }),
  PORT: t.Numeric({ default: 3000 }),

  // Database
  POSTGRES_LYRICS_URL: t.String({
    format: "uri",
    error: "POSTGRES_LYRICS_URL must be a valid URI",
  }),
  POSTGRES_AUTH_URL: t.String({
    format: "uri",
    error: "POSTGRES_AUTH_URL must be a valid URI",
  }),
  VALKEY_URL: t.String({ format: "uri", error: "VALKEY_URL must be a valid URI" }),
});

const decoded = createEnv(EnvSchema, process.env);

const env = {
  ...decoded,
  PROXIES: parseProxyList(decoded.PROXIES),
};

export function getProxy(): string | undefined {
  const proxies = env.PROXIES;
  if (!proxies || proxies.length === 0) return undefined;
  const randomIndex = Math.floor(Math.random() * proxies.length);
  return proxies[randomIndex];
}

export { pkg };
export default env;
