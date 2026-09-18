import env from "@/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/lyrics.ts",
  out: "./src/db/migrations/lyrics",
  dialect: "postgresql",
  dbCredentials: {
    url: env.POSTGRES_LYRICS_URL,
  },
  strict: true,
});
