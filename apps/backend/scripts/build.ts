import { build } from "bun";
import { bunPluginPino } from "bun-plugin-pino";
import { bunPluginKuromoji } from "@root/scripts/bun-plugin-kuromoji";

async function main() {
  const isProd = process.env.NODE_ENV === "production";

  try {
    const buildResult = await build({
      entrypoints: ["./src/index.ts"],
      target: "bun",
      outdir: "./dist",
      root: "./src",
      format: "esm",
      sourcemap: isProd ? "none" : "external",
      minify: isProd,
      external: isProd ? ["pino-pretty"] : [],
      plugins: [
        bunPluginKuromoji(),
        bunPluginPino({
          transports: isProd ? [] : ["pino-pretty"],
        }),
      ],
    });

    if (!buildResult.success) {
      console.error("Build failed:");
      for (const message of buildResult.logs) {
        console.error(message);
      }
      process.exit(1);
    }

    console.log("Server build successful");
  } catch (error) {
    console.error("Fatal error during build:", error);
    process.exit(1);
  }
}

await main();
