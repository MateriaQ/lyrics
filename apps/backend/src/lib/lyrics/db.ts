import db from "@/db/lyrics";
import { arrayContains, eq, sql } from "drizzle-orm";
import { tracks, trackLyrics, type TrackLyricsInsert } from "@/db/schema/lyrics";
import { logger } from "@/logger";
import env from "@/env";
import type { LyricsData, TrackData, RomanizedAPIResponse } from "@/lib/lyrics/types";
import type { AMTrackData as MatcherTrackData } from "@/lib/bridge/matcher";

export const fetchTrackRecordFromDb = (id: string) =>
  db.query.tracks.findFirst({
    where: (t) => arrayContains(t.spotifyIds, [id]),
    columns: {
      revalidate: true,
      revalidatedAt: true,
      hasLyrics: true,
      updatedAt: true,
      releaseDate: true,
      instrumental: true,
    },
    with: {
      lyrics: {
        columns: {
          parsed: true,
          source: true,
          romanFail: true,
          romanV: true,
        },
      },
    },
  });

export type TrackRecord = Awaited<ReturnType<typeof fetchTrackRecordFromDb>>;

export const flagTrackForRevalidation = async (id: string) => {
  const [updatedTrack] = await db
    .update(tracks)
    .set({
      revalidate: true,
      revalidatedAt: null,
    })
    .where(arrayContains(tracks.spotifyIds, [id]))
    .returning({ spotifyIds: tracks.spotifyIds, isrc: tracks.isrc });
  return updatedTrack;
};

export const setTrackInstrumental = async (id: string, isInstrumental: boolean) => {
  const [updatedTrack] = await db
    .update(tracks)
    .set({ instrumental: isInstrumental })
    .where(arrayContains(tracks.spotifyIds, [id]))
    .returning({ id: tracks.id, spotifyIds: tracks.spotifyIds });

  if (updatedTrack && isInstrumental) {
    await db.delete(trackLyrics).where(eq(trackLyrics.trackId, updatedTrack.id));
  }
  return updatedTrack;
};

export const saveLyricsTransaction = async ({
  id,
  track,
  trackHasLyrics,
  hasApiErrors,
  matchData,
  romanRes,
  bestResponse,
  extraSpotifyIds = [],
  extraAppleIds = [],
  instrumental = false,
}: {
  id: string;
  track: NonNullable<TrackData>;
  trackHasLyrics: boolean;
  hasApiErrors: boolean;
  matchData: MatcherTrackData | null;
  romanRes: RomanizedAPIResponse[];
  bestResponse: LyricsData | null;
  extraSpotifyIds?: string[];
  extraAppleIds?: string[];
  instrumental?: boolean;
}) => {
  const isrc = track.isrc;
  if (!isrc) return;

  const appleMusicIdsToInsert = [...new Set([...(matchData?.appleIds || []), ...extraAppleIds])];
  const albumNamesToInsert = [...new Set([track.albumName, ...(matchData?.albumNames || [])])];
  const spotifyIdsToInsert = [...new Set([id, ...extraSpotifyIds])];

  try {
    await db.transaction(async (tx) => {
      const [trackRow] = await tx
        .insert(tracks)
        .values({
          isrc,
          title: [track.name],
          artist: track.artists,
          album: albumNamesToInsert,
          durationMs: track.duration,
          spotifyIds: spotifyIdsToInsert,
          appleMusicIds: appleMusicIdsToInsert,
          hasLyrics: trackHasLyrics && !instrumental,
          instrumental: instrumental,
          revalidate: hasApiErrors,
          revalidatedAt: hasApiErrors ? new Date() : null,
          releaseDate: track.releaseDate ? track.releaseDate : null,
        })
        .onConflictDoUpdate({
          target: tracks.isrc,
          set: {
            title: sql`ARRAY(SELECT DISTINCT UNNEST(array_append(COALESCE(${tracks.title}, ARRAY[]::text[]), ${track.name})))`,
            album: sql`ARRAY(SELECT DISTINCT UNNEST(${tracks.album} || ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(albumNamesToInsert)}::jsonb))::text[]))`,
            spotifyIds: sql`ARRAY(SELECT DISTINCT UNNEST(${tracks.spotifyIds} || ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(spotifyIdsToInsert)}::jsonb))::text[]))`,
            artist: sql`ARRAY(SELECT DISTINCT UNNEST(${tracks.artist} || ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(track.artists)}::jsonb))::text[]))`,
            appleMusicIds: sql`ARRAY(SELECT DISTINCT UNNEST(${tracks.appleMusicIds} || ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(appleMusicIdsToInsert)}::jsonb))::text[]))`,
            durationMs: track.duration,
            hasLyrics: instrumental ? false : trackHasLyrics ? true : tracks.hasLyrics,
            instrumental: instrumental ? true : tracks.instrumental,
            revalidate: hasApiErrors,
            revalidatedAt: hasApiErrors ? new Date() : null,
            releaseDate: track.releaseDate ? track.releaseDate : null,
          },
        })
        .returning();

      if (romanRes.length > 0) {
        const newLyrics: TrackLyricsInsert[] = [];
        for (let i = 0; i < romanRes.length; i++) {
          const result = romanRes[i];

          if (!env.STORE_ALL_LYRICS && bestResponse && result.provider !== bestResponse.provider) {
            continue;
          }

          newLyrics.push({
            trackId: trackRow.id,
            source: result.provider,
            raw: result.raw ?? null,
            parsed: {
              data: result.parsed,
              isCommunity: result.provider === "spicy" ? result.isCommunity : undefined,
            },
            hasLyrics: true,
            romanFail: !result.romanSuccess,
            romanV: result.romanVersion,
            lastRomanAt: new Date(),
          });
        }

        if (newLyrics.length > 0) {
          await tx
            .insert(trackLyrics)
            .values(newLyrics)
            .onConflictDoUpdate({
              target: [trackLyrics.trackId, trackLyrics.source],
              set: {
                raw: sql`EXCLUDED.raw`,
                parsed: sql`EXCLUDED.parsed`,
                romanFail: sql`EXCLUDED.roman_fail`,
                romanV: sql`EXCLUDED.roman_v`,
                lastRomanAt: sql`EXCLUDED.last_roman_at`,
                hasLyrics: true,
              },
            });
        }
      }

      if (instrumental) {
        await tx.delete(trackLyrics).where(eq(trackLyrics.trackId, trackRow.id));
      }
    });
  } catch (err) {
    logger.error({ id, err }, "db store fail");
  }
};
