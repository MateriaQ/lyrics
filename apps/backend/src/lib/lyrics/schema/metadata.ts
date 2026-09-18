import { t } from "elysia";
import { ProviderInfoSchema } from "@/provider";

const TTMLUserSchema = t.Object({
  id: t.String(),
  name: t.String(),
  url: t.String(),
  avatar: t.Optional(t.String()),
});

const GithubUserSchema = t.Object({
  username: t.String(),
  id: t.String(),
});

export const AuthorMetadataSchema = t.Object({
  name: t.String(),
  url: t.Optional(t.String()),
  image: t.Optional(t.String()),
  github: t.Optional(GithubUserSchema),
  spicy: t.Optional(TTMLUserSchema),
});

// am not sure about this
// export const AgentTypeSchema = t.UnionEnum([
//   "person",
//   "character",
//   "group",
//   "organization",
//   "other",
// ]);

const TTMLAgentsSchema = t.Array(
  t.Object({
    type: t.String(),
    id: t.String(),
    name: t.Optional(t.String()),
  }),
);

export const LyricsMetadataSchema = t.Object({
  translations: t.Optional(t.Array(t.String(), { uniqueItems: true })),
  romanizations: t.Optional(t.Array(t.String(), { uniqueItems: true })),
  song_writers: t.Optional(t.Array(t.String())),
  language: t.Optional(t.String()), // only apple music lyrics has language for now
  auto_romanized: t.Optional(t.Boolean()),
  auto_translated: t.Optional(t.Boolean()),
  authors: t.Optional(t.Array(AuthorMetadataSchema)),
  agents: t.Optional(TTMLAgentsSchema),
});

export const TTMLLyricsMetadataSchema = t.Composite([
  LyricsMetadataSchema,
  t.Object({ amll: t.Optional(t.Record(t.String(), t.Array(t.String()))) }),
]);

export const MetadataSchema = t.Object({
  meta: LyricsMetadataSchema,
  provider: ProviderInfoSchema,
});
