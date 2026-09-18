import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  pgEnum,
  primaryKey,
  integer,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { Lyrics } from "@/lib/lyrics/schema";
import type { SpotifyLyricsResponse } from "@/lib/spotify";
import type { Lyrics as SpicyLyrics } from "@/lib/spicy/types";

export const sourceEnum = pgEnum("source_type", [
  "spotify",
  "apple",
  "spicy",
  "amll",
  "cider",
  "musixmatch",
]);
export type Provider = (typeof sourceEnum.enumValues)[number];
export type DBLyrics = { data: Lyrics; isCommunity?: boolean };

export const tracks = pgTable(
  "tracks",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => Bun.randomUUIDv7()),
    isrc: text("isrc").unique().notNull(),

    // Metadata
    title: text("title").array().notNull(),
    artist: text("artist").array().notNull(),
    album: text("album").array().notNull(),
    durationMs: integer("duration_ms").notNull(),
    releaseDate: timestamp("release_date"),

    // Identifier
    spotifyIds: text("spotify_ids").array().notNull(),
    appleMusicIds: text("apple_music_ids").array().notNull(),

    hasLyrics: boolean("has_lyrics").notNull().default(true),
    instrumental: boolean("instrumental").notNull().default(false),

    revalidate: boolean("revalidate").notNull().default(false),
    revalidatedAt: timestamp("revalidated_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("idx_tracks_title_gin").using("gin", t.title),
    index("idx_tracks_artist_gin").using("gin", t.artist),
    index("idx_tracks_album_gin").using("gin", t.album),

    index("idx_tracks_spotify_ids").using("gin", t.spotifyIds),
    index("idx_tracks_apple_ids").using("gin", t.appleMusicIds),
    index("idx_tracks_revalidate").on(t.revalidate),
  ],
);

export const trackLyrics = pgTable(
  "track_lyrics",
  {
    trackId: uuid("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    source: sourceEnum("source").notNull(),
    version: integer("version").notNull().default(1),

    raw: jsonb("raw").$type<string | SpotifyLyricsResponse | SpicyLyrics>(),
    parsed: jsonb("parsed").$type<DBLyrics>(),

    romanV: integer("roman_v").default(0).notNull(),
    romanFail: boolean("roman_fail"),
    lastRomanAt: timestamp("last_roman_at"),

    hasLyrics: boolean("has_lyrics").notNull().default(true),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.trackId, t.source] })],
);

export const tracksRelations = relations(tracks, ({ many }) => ({
  lyrics: many(trackLyrics),
}));

export const trackLyricsRelations = relations(trackLyrics, ({ one }) => ({
  track: one(tracks, {
    fields: [trackLyrics.trackId],
    references: [tracks.id],
  }),
}));

export const syncStates = pgTable("sync_states", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type SyncStateDB = typeof syncStates.$inferSelect;
export type SyncStateInsert = typeof syncStates.$inferInsert;

export type TrackDB = typeof tracks.$inferSelect;
export type TrackInsert = typeof tracks.$inferInsert;

export type TrackLyricsDB = typeof trackLyrics.$inferSelect;
export type TrackLyricsInsert = typeof trackLyrics.$inferInsert;
