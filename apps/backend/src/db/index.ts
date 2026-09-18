import authDb from "@/db/auth";
import lyricsDb from "@/db/lyrics";

import { sql } from "drizzle-orm";
import { logger } from "@/logger";

export async function checkPostgres() {
  try {
    await lyricsDb.execute(sql`SELECT 1`);
    await authDb.execute(sql`SELECT 1`);
  } catch (err) {
    logger.error(err, "Postgres Health Check Failed");
    throw new Error("Failed to connect to PostgreSQL", { cause: err });
  }
}
