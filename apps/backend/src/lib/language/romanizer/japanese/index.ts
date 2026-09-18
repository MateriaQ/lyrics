// @ts-ignore
import Kuroshiro from "kuroshiro";
import { analyzer } from "@/lib/language/romanizer/japanese/analyzer";
import { logger } from "@/logger";

const instance = new Kuroshiro();

const kuroshiroInitPromise = instance.init(analyzer).catch((err: unknown) => {
  logger.error(err, "Failed to initialize Kuroshiro instance");
  throw err;
});

const KUROSHIRO_OPTS = { mode: "spaced", to: "romaji" };

async function romanizeJapanese(text: string): Promise<string> {
  await kuroshiroInitPromise;
  return instance.convert(text, KUROSHIRO_OPTS);
}

export { romanizeJapanese as romanize };
