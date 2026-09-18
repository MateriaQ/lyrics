import { t } from "elysia";
import { createRouter, ratelimit } from "@/utils/app";
import { HTTP_CODES } from "@/lib/http";

import {
  LyricsModels,
  SpotifyTrackId,
  LyricsResponse,
  RevalidateResponse,
  InstrumentalResponse,
  NotFoundError,
  InstrumentalSongError,
  UnauthorizedError,
  ForbiddenError,
  ServerError,
} from "@/lib/lyrics/schema/api";

import {
  getSpotifyLyrics,
  revalidateSpotifyLyrics,
  instrumentalSpotifyLyrics,
} from "@/routes/lyrics/spotify/spotify.controller";

export const spotifyLyricsRouter = createRouter({ name: "lyrics-spotify", prefix: "/sp" })
  .model(LyricsModels)
  .use(
    ratelimit({
      duration: 10_000,
      max: 8,
      scoping: "scoped",
    }),
  )
  .get(
    "/:id",
    async ({ params: { id }, status }) => {
      const { code, response } = await getSpotifyLyrics(id);
      return status(code, response);
    },
    {
      params: t.Object({
        id: SpotifyTrackId,
      }),
      response: {
        [HTTP_CODES.OK]: LyricsResponse,
        [HTTP_CODES.NOT_FOUND]: NotFoundError,
        [HTTP_CODES.INTERNAL_SERVER_ERROR]: ServerError,
      },
      detail: {
        summary: "Get Lyrics by Spotify ID",
        description:
          "Fetches best available lyrics from upstream providers, writes to cache, and returns parsed lines.",
        tags: ["Lyrics - Spotify"],
      },
    },
  )
  .post(
    "/:id/revalidate",
    async ({ params: { id }, query, status }) => {
      const { code, response } = await revalidateSpotifyLyrics(id, query.force ?? false);
      return status(code, response);
    },
    {
      admin: true,
      params: t.Object({
        id: SpotifyTrackId,
      }),
      query: t.Object({
        force: t.Optional(
          t.Boolean({
            default: false,
            description: "Force re-scrape even if flagged as instrumental in the database",
          }),
        ),
      }),
      response: {
        [HTTP_CODES.OK]: RevalidateResponse,
        [HTTP_CODES.UNAUTHORIZED]: UnauthorizedError,
        [HTTP_CODES.FORBIDDEN]: ForbiddenError,
        [HTTP_CODES.UNPROCESSABLE_ENTITY]: InstrumentalSongError,
        [HTTP_CODES.INTERNAL_SERVER_ERROR]: ServerError,
      },
      detail: {
        summary: "Revalidate Cached Lyrics",
        description:
          "Forces an immediate upstream re-scrape to re-populate the cache. Requires admin authentication.",
        tags: ["Lyrics - Spotify"],
        security: [{ bearerAuth: [] }],
      },
    },
  )
  .post(
    "/:id/instrumental",
    async ({ params: { id }, body, status }) => {
      const { code, response } = await instrumentalSpotifyLyrics(id, body.instrumental);
      return status(code, response);
    },
    {
      admin: true,
      params: t.Object({
        id: SpotifyTrackId,
      }),
      body: t.Object({
        instrumental: t.Boolean({
          description: "True if track contains no lyrics; false to allow lyric scrapes",
        }),
      }),
      response: {
        [HTTP_CODES.OK]: InstrumentalResponse,
        [HTTP_CODES.UNAUTHORIZED]: UnauthorizedError,
        [HTTP_CODES.FORBIDDEN]: ForbiddenError,
        [HTTP_CODES.NOT_FOUND]: NotFoundError,
        [HTTP_CODES.INTERNAL_SERVER_ERROR]: ServerError,
      },
      detail: {
        summary: "Update Instrumental Status",
        description:
          "Flags a track as instrumental to prevent unnecessary lyric fetches. Requires admin authentication.",
        tags: ["Lyrics - Spotify"],
        security: [{ bearerAuth: [] }],
      },
    },
  );
