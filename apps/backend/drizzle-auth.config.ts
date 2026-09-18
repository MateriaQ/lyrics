import env from "@/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/auth.ts",
  out: "./src/db/migrations/auth",
  dialect: "postgresql",
  dbCredentials: {
    url: env.POSTGRES_AUTH_URL,
  },
  strict: true,
});
