import { cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { BunPlugin } from "bun";
import { KUROMOJI_DICT_FILES } from "@/constants";

const KUROMOJI_CDN_URL = "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict";

const SRC_DICT_PATH = resolve(process.cwd(), "src/lib/language/romanizer/japanese/kuromoji-dict");
const DIST_DICT_PATH = resolve(process.cwd(), "dist/kuromoji-dict");

function hasAllDictionaries(dirPath: string): boolean {
  if (!existsSync(dirPath)) return false;
  return KUROMOJI_DICT_FILES.every((fileName) => existsSync(resolve(dirPath, fileName)));
}

async function downloadDictionaries(targetPath: string) {
  await mkdir(targetPath, { recursive: true });

  await Promise.all(
    KUROMOJI_DICT_FILES.map(async (fileName) => {
      // fallow-ignore-next-line security-sink -- link is constant
      const response = await fetch(`${KUROMOJI_CDN_URL}/${fileName}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${fileName}: ${response.statusText}`);
      }

      const filePath = resolve(targetPath, fileName);
      await Bun.write(filePath, response);
    }),
  );
}

export const bunPluginKuromoji = (): BunPlugin => ({
  name: "bun-plugin-kuromoji",
  async setup(build) {
    build.onStart(async () => {
      try {
        if (!hasAllDictionaries(SRC_DICT_PATH)) {
          await downloadDictionaries(SRC_DICT_PATH);
        }

        await mkdir(DIST_DICT_PATH, { recursive: true });
        await cp(SRC_DICT_PATH, DIST_DICT_PATH, {
          recursive: true,
          force: true,
        });
      } catch (error) {
        console.error("Error in bun-plugin-kuromoji:", error);
        throw error;
      }
    });
  },
});
