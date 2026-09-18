CREATE TYPE "public"."source_type" AS ENUM('spotify', 'apple', 'spicy', 'amll', 'cider');--> statement-breakpoint
CREATE TABLE "sync_states" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "track_lyrics" (
	"track_id" uuid NOT NULL,
	"source" "source_type" NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"raw" jsonb,
	"parsed" jsonb,
	"roman_v" integer DEFAULT 0 NOT NULL,
	"roman_fail" boolean,
	"last_roman_at" timestamp,
	"has_lyrics" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "track_lyrics_track_id_source_pk" PRIMARY KEY("track_id","source")
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"isrc" text NOT NULL,
	"title" text[] NOT NULL,
	"artist" text[] NOT NULL,
	"album" text[] NOT NULL,
	"duration_ms" integer NOT NULL,
	"release_date" timestamp,
	"spotify_ids" text[] NOT NULL,
	"apple_music_ids" text[] NOT NULL,
	"has_lyrics" boolean DEFAULT true NOT NULL,
	"instrumental" boolean DEFAULT false NOT NULL,
	"revalidate" boolean DEFAULT false NOT NULL,
	"revalidated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tracks_isrc_unique" UNIQUE("isrc")
);
--> statement-breakpoint
ALTER TABLE "track_lyrics" ADD CONSTRAINT "track_lyrics_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tracks_title_gin" ON "tracks" USING gin ("title");--> statement-breakpoint
CREATE INDEX "idx_tracks_artist_gin" ON "tracks" USING gin ("artist");--> statement-breakpoint
CREATE INDEX "idx_tracks_album_gin" ON "tracks" USING gin ("album");--> statement-breakpoint
CREATE INDEX "idx_tracks_spotify_ids" ON "tracks" USING gin ("spotify_ids");--> statement-breakpoint
CREATE INDEX "idx_tracks_apple_ids" ON "tracks" USING gin ("apple_music_ids");--> statement-breakpoint
CREATE INDEX "idx_tracks_revalidate" ON "tracks" USING btree ("revalidate");