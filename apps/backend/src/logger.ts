import { createPinoLogger } from "@bogeychan/elysia-logger";
import { isDev, isProd } from "@/node-env";

type ElysiaLoggerOptions = Parameters<typeof createPinoLogger>[0];

let stream;

if (isDev) {
  const { default: pretty } = await import("pino-pretty");
  stream = pretty({
    colorize: true,
    translateTime: "SYS:HH:MM:ss",
    ignore: "hostname,pid",
  });
}

const pinoOptions: ElysiaLoggerOptions = {
  level: isProd ? "info" : "debug",
  base: undefined,
  timestamp: false,
  stream,
};

export const logger = createPinoLogger(pinoOptions);
