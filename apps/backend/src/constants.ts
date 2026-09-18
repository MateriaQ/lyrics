export const X_LINK = "https://x.com/sanoojes";
export const GITHUB_SOCIAL_LINK = "https://github.com/MateriaQ/lyrics";
export const DISCORD_SOCIAL_LINK = "https://sanooj.es/spicetify-discord";
export const WEBSITE_LINK = "https://lyrics.materiaq.org";

export const LOGO_PATH = "/static/shared/logo.png";
export const SOCIAL_X_ICON = "/static/shared/social-x-white.png";
export const SOCIAL_GITHUB_ICON = "/static/shared/social-gh-white.png";
export const SOCIAL_DISCORD_ICON = "/static/shared/social-dc-white.png";
export const SOCIAL_WEBSITE_ICON = "/static/shared/social-web-white.png";
export const HERO_ACTIVATION_IMAGE = "/static/shared/dither-image.png";
export const HERO_RESET_IMAGE = "/static/shared/dither-image.png";

export const KUROMOJI_DICT_FILES = [
  "base.dat.gz",
  "cc.dat.gz",
  "check.dat.gz",
  "tid.dat.gz",
  "tid_map.dat.gz",
  "tid_pos.dat.gz",
  "unk.dat.gz",
  "unk_compat.dat.gz",
  "unk_invoke.dat.gz",
  "unk_map.dat.gz",
  "unk_pos.dat.gz",
];

const ONE_DAY_S = 24 * 60 * 60;

export const THIRTY_DAYS_S = 30 * ONE_DAY_S;
export const THIRTY_DAYS_MS = THIRTY_DAYS_S * 1000;

export const SEVEN_DAYS_S = 7 * ONE_DAY_S;
export const FIVE_DAYS_S = 5 * ONE_DAY_S;

export const SIXTEEN_DAYS_S = 16 * ONE_DAY_S;
export const THREE_DAYS_S = 3 * ONE_DAY_S;

export const LYRICS_CHANNEL = "lyrics_updates";
export const SPOTIFY_CACHE_PREFIX = "lyrics:spotify:";
export const REDIS_NOT_FOUND_MARKER = "nf";
export const REDIS_INSTRUMENTAL_MARKER = "inst";
export const LOCK_TTL = "30";
export const LOCK_TTL_MS = Number.parseInt(LOCK_TTL) * 1000;
export const REVALIDATION_COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 hours
