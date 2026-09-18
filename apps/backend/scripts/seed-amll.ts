// TODO: refactor slop
import { sql, inArray } from "drizzle-orm";
import db, { lyricsClient as client } from "@/db/lyrics";
import { tracks, trackLyrics, syncStates, type DBLyrics } from "@/db/schema/lyrics";
import { parse } from "@/lib/ttml/parser";
import { romanizeLyrics, VERSION as ROMAN_VERSION } from "@/lib/lyrics/romanize";
import { logger } from "@/logger";

import { $, Glob, file, write } from "bun";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const AMLL_VERSION_URL =
  "https://raw.githubusercontent.com/amll-dev/amll-ttml-db/main/raw-lyrics/version.json";
const AMLL_ZIP_URL =
  "https://raw.githubusercontent.com/amll-dev/amll-ttml-db/main/raw-lyrics/raw-lyrics.zip";
const SYNC_KEY_COMMIT = "amll_ttml_db_commit";
const SYNC_KEY_ROMAN_V = "amll_roman_version";

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function seedAmll(options: { forceSeed?: boolean } = {}) {
  const forceSeed = options.forceSeed ?? false;

  logger.info("Checking AMLL database version...");

  const versionRes = await fetch(AMLL_VERSION_URL);
  if (!versionRes.ok) throw new Error("Failed to fetch version.json");

  const { commit: latestCommit } = (await versionRes.json()) as { commit: string };

  const states = await db.query.syncStates.findMany({
    where: inArray(syncStates.key, [SYNC_KEY_COMMIT, SYNC_KEY_ROMAN_V]),
  });

  const commitState = states.find((s) => s.key === SYNC_KEY_COMMIT)?.value;
  const romanState = states.find((s) => s.key === SYNC_KEY_ROMAN_V)?.value;

  const isCommitSame = commitState === latestCommit;
  const isRomanVSame = romanState === String(ROMAN_VERSION);

  if (!forceSeed && isCommitSame && isRomanVSame) {
    logger.info(
      { commit: latestCommit },
      "AMLL database and romanizer are up to date. Skipping seed.",
    );
    return { status: "up-to-date", commit: latestCommit };
  }

  logger.info(
    forceSeed
      ? "Force flag enabled. Bypassing version checks for a full re-seed."
      : {
          oldCommit: commitState || "None",
          newCommit: latestCommit,
          romanVersion: ROMAN_VERSION,
        },
    "Fetching new lyrics archive...",
  );

  const zipRes = await fetch(AMLL_ZIP_URL);
  if (!zipRes.ok) throw new Error("Failed to fetch raw-lyrics.zip");

  const tmpDir = await mkdtemp(join(tmpdir(), "amll-"));
  const zipPath = join(tmpDir, "raw-lyrics.zip");
  const extractPath = join(tmpDir, "extracted");

  await mkdir(extractPath, { recursive: true });

  try {
    await write(zipPath, zipRes);

    logger.info("Extracting lyrics archive...");
    try {
      await $`unzip -q -o ${zipPath} -d ${extractPath}`.quiet();
    } catch (err) {
      logger.error(
        err,
        "Failed to extract ZIP. Please ensure 'unzip' is installed on your system.",
      );
      throw err;
    }

    const glob = new Glob("**/*.ttml");
    const ttmlFiles = Array.from(glob.scanSync(extractPath)).map((f) => join(extractPath, f));

    const parsedResults = await Promise.all(
      ttmlFiles.map(async (filepath) => {
        try {
          const ttmlString = await file(filepath).text();
          return {
            filepath,
            ttmlString,
            parsed: parse(ttmlString, { mode: "amll" }),
            error: null,
          };
        } catch (error) {
          return { filepath, ttmlString: null, parsed: null, error };
        }
      }),
    );

    const uniqueIsrcs = new Set<string>();
    const parsedItems = [];

    for (const result of parsedResults) {
      if (result.error || !result.parsed?.success || !result.parsed.data) continue;

      const amllMeta = result.parsed.meta?.amll ?? {};
      const { _amll, ...meta } = result.parsed.meta ?? {};
      const isrc = amllMeta.isrc?.[0];

      if (!isrc || uniqueIsrcs.has(isrc)) continue;

      uniqueIsrcs.add(isrc);
      parsedItems.push({
        ttmlString: result.ttmlString as string,
        isrc,
        amllMeta,
        baseParsed: {
          type: "lyrics" as const,
          lyrics: result.parsed.data,
          meta,
          provider: {
            id: "amll",
            name: "AMLL",
            url: "https://github.com/amll-dev/amll-ttml-db",
          } as const,
        },
      });
    }

    logger.info(`Parsed ${parsedItems.length} unique items. Saving to database concurrently...`);

    const BATCH_SIZE = 200;
    const itemChunks = chunkArray(parsedItems, BATCH_SIZE);

    await Promise.all(
      itemChunks.map(async (chunk) => {
        const isrcList = chunk.map((p) => p.isrc);

        const existingTracks = await db.query.tracks.findMany({
          where: inArray(tracks.isrc, isrcList),
          with: { lyrics: true },
        });

        const processedItems = await Promise.all(
          chunk.map(async (item) => {
            const existingAmll = existingTracks
              .find((t) => t.isrc === item.isrc)
              ?.lyrics.find((l) => l.source === "amll");

            const needsRomanization =
              forceSeed ||
              !existingAmll ||
              existingAmll.raw !== item.ttmlString ||
              existingAmll.romanFail ||
              existingAmll.romanV < ROMAN_VERSION;

            if (needsRomanization || !existingAmll) {
              const romanized = await romanizeLyrics(item.baseParsed);
              return {
                ...item,
                payload: { data: romanized.payload, isCommunity: false } as DBLyrics,
                rFail: !romanized.success,
                rV: romanized.version,
                rAt: new Date(),
                wasRomanized: true,
              };
            }

            return {
              ...item,
              payload: existingAmll.parsed as DBLyrics,
              rFail: existingAmll.romanFail ?? false,
              rV: existingAmll.romanV,
              rAt: existingAmll.lastRomanAt ?? new Date(),
              wasRomanized: false,
            };
          }),
        );

        try {
          await db.transaction(async (tx) => {
            const returnedTracks = await tx
              .insert(tracks)
              .values(
                processedItems.map(({ isrc, amllMeta }) => ({
                  isrc,
                  title: amllMeta.musicName ?? [],
                  artist: amllMeta.artist ?? amllMeta.artists ?? [],
                  album: amllMeta.album ?? [],
                  durationMs: amllMeta.duration?.[0] ? parseInt(amllMeta.duration[0], 10) || 0 : 0,
                  spotifyIds: amllMeta.spotifyId ?? [],
                  appleMusicIds: amllMeta.appleMusicId ?? [],
                  hasLyrics: true,
                  revalidate: true,
                })),
              )
              .onConflictDoUpdate({
                target: tracks.isrc,
                set: {
                  title: sql`ARRAY(SELECT DISTINCT UNNEST(${tracks.title} || EXCLUDED.title))`,
                  artist: sql`ARRAY(SELECT DISTINCT UNNEST(${tracks.artist} || EXCLUDED.artist))`,
                  album: sql`ARRAY(SELECT DISTINCT UNNEST(${tracks.album} || EXCLUDED.album))`,
                  spotifyIds: sql`ARRAY(SELECT DISTINCT UNNEST(${tracks.spotifyIds} || EXCLUDED.spotify_ids))`,
                  appleMusicIds: sql`ARRAY(SELECT DISTINCT UNNEST(${tracks.appleMusicIds} || EXCLUDED.apple_music_ids))`,
                  durationMs: sql`EXCLUDED.duration_ms`,
                  hasLyrics: true,
                  revalidate: true,
                },
              })
              .returning({ id: tracks.id, isrc: tracks.isrc });

            await tx
              .insert(trackLyrics)
              .values(
                processedItems.map((item) => ({
                  trackId: returnedTracks.find((t) => t.isrc === item.isrc)!.id,
                  source: "amll" as const,
                  raw: item.ttmlString,
                  parsed: item.payload,
                  hasLyrics: true,
                  romanFail: item.rFail,
                  romanV: item.rV,
                  lastRomanAt: item.rAt,
                })),
              )
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
          });
        } catch (err) {
          logger.error(err, "Database chunk insertion failed");
        }
      }),
    );

    await db
      .insert(syncStates)
      .values([
        { key: SYNC_KEY_COMMIT, value: latestCommit },
        { key: SYNC_KEY_ROMAN_V, value: String(ROMAN_VERSION) },
      ])
      .onConflictDoUpdate({
        target: syncStates.key,
        set: { value: sql`EXCLUDED.value` },
      });

    logger.info("AMLL seeding completed successfully.");
    return { status: "success", commit: latestCommit };
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

if (import.meta.main) {
  seedAmll({ forceSeed: Bun.argv.includes("--force") })
    .then(async () => {
      if (client) await client.end();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error(err, "Seed failed");
      if (client) await client.end();
      process.exit(1);
    });
}
