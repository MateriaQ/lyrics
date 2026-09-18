import { join } from "node:path";
import { format } from "oxfmt";

const REMOTE_URL =
  "https://raw.githubusercontent.com/Spikerko/spicy-lyrics/main/src/utils/objpack.ts";
const LOCAL_PATH = join(import.meta.dirname, "../src/lib/spicy/objpack.ts");

async function syncObjpack() {
  const response = await fetch(REMOTE_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch remote file: ${response.status} ${response.statusText}`);
  }

  const remoteContent = await response.text();
  const code = `// fallow-ignore-file unused-class-member\n// synced from upstream Spikerko/spicy-lyrics\n// DO NOT EDIT\n\n${remoteContent}`;
  const localFile = Bun.file(LOCAL_PATH);
  let localContent = "";

  if (await localFile.exists()) {
    localContent = await localFile.text();
  }

  const result = await format(LOCAL_PATH, code);
  const formattedContent = result.code;

  if (localContent === formattedContent) {
    console.log("Up to date.");
    return;
  }

  await Bun.write(LOCAL_PATH, formattedContent);
  console.log("Updated.");
}

void syncObjpack();
