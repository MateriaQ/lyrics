import { t, type TSchema } from "elysia";
import { LyricsResponseSchema } from "@/lib/lyrics/schema/lyrics";

const createSuccess = <T extends TSchema>(data: T, description?: string) =>
  t.Object(
    {
      status: t.Literal("success"),
      data,
    },
    { description },
  );

const createError = <TCode extends string>(code: TCode, description?: string) =>
  t.Object(
    {
      status: t.Literal("error"),
      error: t.Object({
        code: t.Literal(code),
        message: t.String({ description: "Error details" }),
      }),
    },
    { description },
  );

export const SpotifyTrackId = t.String({
  minLength: 16,
  maxLength: 32,
  pattern: "^[a-zA-Z0-9]+$",
  error: "A valid Spotify Track ID is required.",
  description: "The unique Spotify ID of the track",
  examples: ["4cOdK2wGLETKBW3PvgPWqT", "0JHDGixXteQasXlTXL6Mav"],
});
export const LyricsModels = {
  Lyrics: LyricsResponseSchema,
} as const;

export const LyricsResponse = createSuccess(
  t.Ref("Lyrics"),
  "Successfully retrieved and parsed lyrics",
);

export const RevalidateResponse = createSuccess(
  t.Object({
    revalidated: t.Boolean({ description: "Whether revalidation succeeded" }),
  }),
  "Track lyrics successfully revalidated",
);

export const InstrumentalResponse = createSuccess(
  t.Object({
    instrumental: t.Boolean({ description: "Updated instrumental state" }),
  }),
  "Instrumental status successfully updated",
);

export const NotFoundError = createError("NOT_FOUND", "The requested resource could not be found");

export const InstrumentalSongError = createError(
  "INSTRUMENTAL_SONG",
  "The track is marked as instrumental and cannot have lyrics",
);

export const UnauthorizedError = createError(
  "UNAUTHORIZED",
  "Authentication is missing or invalid",
);

export const ForbiddenError = createError(
  "FORBIDDEN",
  "Insufficient privileges to access this resource or perform this action.",
);

export const ServerError = createError("SERVER_ERROR", "An unexpected internal error occurred");
