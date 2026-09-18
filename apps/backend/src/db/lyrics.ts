import env from "@/env";
import * as schema from "@/db/schema/lyrics";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { logger } from "@/logger";
import { isProd } from "@/node-env";

export const lyricsClient = postgres(env.POSTGRES_LYRICS_URL);
const lyricsDb = drizzle(lyricsClient, {
  schema,
  logger: isProd
    ? false
    : {
        logQuery(query, params) {
          logger.debug({ query, params }, "Lyrics DB Query");
        },
      },
});
export default lyricsDb;
