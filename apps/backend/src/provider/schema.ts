import { t } from "elysia";
// "amll", "lrclib",
const LyricsProvidersSchema = t.UnionEnum([
  "spicy",
  "apple",
  "spotify",
  "amll",
  "cider",
  "musixmatch",
]);

export const ProviderInfoSchema = t.Object({
  name: t.String(),
  id: LyricsProvidersSchema,
  url: t.Optional(t.String()),
});

export const ProviderInfoMapSchema = t.Record(t.String(), ProviderInfoSchema);
