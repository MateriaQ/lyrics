import { logger } from "@/logger";
import { checkPostgres } from "@/db";
import { checkRedis } from "@/db/redis";
import { checkMailer } from "@/emails";
import { checkAppleLyrics, checkAppleSearch, checkAppleTokenExpiry } from "@/lib/apple/check";
import { isProd } from "@/node-env";

type Task = {
  name: string;
  task: () => Promise<void | boolean>;
};

export async function verifyServices() {
  const tasks: Task[] = [
    { name: "Redis", task: checkRedis },
    { name: "PostgreSQL", task: checkPostgres },
    { name: "Apple Token Expiry", task: checkAppleTokenExpiry },
  ];

  if (isProd) {
    tasks.push(
      { name: "Mailer", task: checkMailer },
      { name: "Apple Search", task: checkAppleSearch },
      { name: "Apple Lyrics", task: checkAppleLyrics },
    );
  }

  const results = await Promise.allSettled(tasks.map((s) => s.task()));
  let hasError = false;

  results.forEach((result, i) => {
    const service = tasks[i].name;

    if (result.status === "rejected" || (result.status === "fulfilled" && result.value === false)) {
      const err = result.status === "rejected" ? result.reason : "Service check returned false";
      logger.error({ err }, `${service} initialization failed.`);
      hasError = true;
    } else {
      logger.info(`${service} verified.`);
    }
  });

  if (hasError) {
    logger.fatal("Startup aborted due to unreachable critical services.");
    process.exit(1);
  }

  logger.info("All services ready.");
}
