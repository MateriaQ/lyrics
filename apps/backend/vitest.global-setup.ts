import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { logger } from "@/logger";

const currentDir = import.meta.dirname ?? fileURLToPath(new URL(".", import.meta.url));

const TEST_DB_DEFAULT = "postgresql://materiaq:materiaq_password@localhost:5432";
const LYRICS_URL = forceTestDb(process.env.POSTGRES_LYRICS_URL, "lyrics_test");
const AUTH_URL = forceTestDb(process.env.POSTGRES_AUTH_URL, "auth_test");

function forceTestDb(rawUrl: string | undefined, testDb: string): string {
  const base = rawUrl ?? `${TEST_DB_DEFAULT}/${testDb}`;
  const parsed = new URL(base);
  parsed.pathname = `/${testDb}`;
  return parsed.toString();
}

function getBaseUrl(rawUrl: string): string {
  const parsed = new URL(rawUrl);
  const port = parsed.port || "5432";
  return `${parsed.protocol}//${parsed.username}:${parsed.password}@${parsed.hostname}:${port}`;
}

async function ensureDatabase(adminClient: postgres.Sql, dbName: string): Promise<void> {
  const [exists] = await adminClient`SELECT 1 FROM pg_database WHERE datname = ${dbName}`;
  if (!exists) {
    await adminClient.unsafe(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
    logger.info(`Test database "${dbName}" created ✅`);
  }
}

async function runTestMigrations(): Promise<void> {
  logger.info("Starting test database setup & migrations ⌛");

  const lyricsDbName = new URL(LYRICS_URL).pathname.replace(/^\//, "");
  const authDbName = new URL(AUTH_URL).pathname.replace(/^\//, "");

  const adminClient = postgres(`${getBaseUrl(LYRICS_URL)}/postgres`, { max: 1 });
  try {
    await ensureDatabase(adminClient, lyricsDbName);
    await ensureDatabase(adminClient, authDbName);
  } finally {
    await adminClient.end();
  }

  const authClient = postgres(AUTH_URL, { max: 1 });
  const lyricsClient = postgres(LYRICS_URL, { max: 1 });

  try {
    await migrate(drizzle(authClient), {
      migrationsFolder: resolve(currentDir, "src/db/migrations/auth"),
    });
    logger.info("Test Auth DB migrations completed ✅");

    await migrate(drizzle(lyricsClient), {
      migrationsFolder: resolve(currentDir, "src/db/migrations/lyrics"),
    });
    logger.info("Test Lyrics DB migrations completed ✅");

    logger.info("All test migrations completed successfully ✅");
  } catch (error) {
    logger.error(error, "Test migration process failed 🚨");
    process.exitCode = 1;
    throw error;
  } finally {
    await Promise.allSettled([authClient.end(), lyricsClient.end()]);
  }
}

export async function setup(): Promise<void> {
  await runTestMigrations();
}
