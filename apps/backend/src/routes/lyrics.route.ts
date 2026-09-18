import { createRouter } from "@/utils/app";
import { spotifyLyricsRouter } from "@/routes/lyrics/spotify/spotify.route";

// TODO: add /am/<id>, /isrc/<id> routes
export const lyricsRouter = createRouter({ prefix: "/lyrics" }).use(spotifyLyricsRouter);
