import { describe, expect, it } from "vitest";
import { HTTP_CODES } from "@/lib/http";
import { spotifyLyricsRouter } from "@/routes/lyrics/spotify/spotify.route";

const SPOTIFY_TRACK_ID = "4cOdK2wGLETKBW3PvgPWqT";

describe("spotifyLyricsRouter (/sp)", () => {
  describe("GET /sp/:id", () => {
    it("should reject requests with an invalid track ID format", async () => {
      const response = await spotifyLyricsRouter.handle(
        new Request("http://localhost/sp/invalid-id!"),
      );

      expect(response.status).toBe(HTTP_CODES.UNPROCESSABLE_ENTITY);
    });

    it("should process a request with a valid track ID format", async () => {
      const response = await spotifyLyricsRouter.handle(
        new Request(`http://localhost/sp/${SPOTIFY_TRACK_ID}`),
      );

      expect([HTTP_CODES.OK, HTTP_CODES.NOT_FOUND, HTTP_CODES.INTERNAL_SERVER_ERROR]).toContain(
        response.status,
      );
    });
  });

  describe("POST /sp/:id/revalidate", () => {
    it("should fail validation when authorization header is missing", async () => {
      const response = await spotifyLyricsRouter.handle(
        new Request(`http://localhost/sp/${SPOTIFY_TRACK_ID}/revalidate`, {
          method: "POST",
        }),
      );

      expect(response.status).toBe(HTTP_CODES.UNAUTHORIZED);
    });
  });

  describe("POST /sp/:id/instrumental", () => {
    it("should fail validation when body format is incorrect", async () => {
      const response = await spotifyLyricsRouter.handle(
        new Request(`http://localhost/sp/${SPOTIFY_TRACK_ID}/instrumental`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ instrumental: "not-a-boolean" }),
        }),
      );

      expect(response.status).toBe(HTTP_CODES.UNPROCESSABLE_ENTITY);
    });

    it("should accept valid payload for updating instrumental status", async () => {
      const response = await spotifyLyricsRouter.handle(
        new Request(`http://localhost/sp/${SPOTIFY_TRACK_ID}/instrumental`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ instrumental: true }),
        }),
      );

      expect([
        HTTP_CODES.OK,
        HTTP_CODES.UNAUTHORIZED,
        HTTP_CODES.NOT_FOUND,
        HTTP_CODES.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);
    });
  });
});
