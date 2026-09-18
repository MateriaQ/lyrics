import env from "@/env";
import * as schema from "@/db/schema/auth";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { logger } from "@/logger";
import { isProd } from "@/node-env";

export const authClient = postgres(env.POSTGRES_AUTH_URL);
const authDb = drizzle(authClient, {
  schema,
  logger: isProd
    ? false
    : {
        logQuery(query, params) {
          logger.debug({ query, params }, "Auth DB Query");
        },
      },
});

export default authDb;
