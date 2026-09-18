import env from "@/env";
import { logger } from "@/logger";

import { createApp } from "@/utils/app";
import { verifyServices } from "@/utils/startup";

import redis from "@/db/redis";
import { authClient } from "@/db/auth";
import { lyricsClient } from "@/db/lyrics";

import { analyzer } from "@/lib/language/romanizer/japanese/analyzer";

import { indexRouter } from "@/routes/index.route";
import { lyricsRouter } from "@/routes/lyrics.route";
import { cron } from "@/cron";

if (!(await analyzer.validate())) {
  logger.warn("Kuromoji init failed. Japanese romanizations disabled.");
}
await verifyServices();

export const app = (
  await createApp({
    prefix: env.BASE_PATH,
    serve: {
      maxRequestBodySize: 1024 * 1024 * 4, // 4 MB
    },
  })
)
  .use(cron)
  .use(indexRouter)
  .group("/v1", (app) => app.use(lyricsRouter))
  .listen(env.PORT);

logger.info(`Server running at http://${app.server?.hostname}:${app.server?.port}${env.BASE_PATH}`);

let isShuttingDown = false;

async function handleShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, "Shutting down");

  const exitTimeout = setTimeout(() => {
    logger.fatal("Shutdown timeout, forcing exit");
    process.exit(1);
  }, 10000).unref();

  try {
    await app.stop().catch((err) => logger.error(err, "Error stopping server"));
    redis.close();
    await Promise.allSettled([authClient.end(), lyricsClient.end()]);

    logger.info("Shutdown complete");
    clearTimeout(exitTimeout);
    process.exit(0);
  } catch (err) {
    logger.error(err, "Shutdown error");
    clearTimeout(exitTimeout);
    process.exit(1);
  }
}

process.removeAllListeners("SIGINT");
process.removeAllListeners("SIGTERM");
process.removeAllListeners("uncaughtException");
process.removeAllListeners("unhandledRejection");

process.on("SIGINT", () => {
  void handleShutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void handleShutdown("SIGTERM");
});

process.on("uncaughtException", (error) => {
  logger.fatal(error, "Uncaught Exception");
  void handleShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  logger.fatal({ reason, promise }, "Unhandled Rejection");
  void handleShutdown("unhandledRejection");
});

export type App = typeof app;
