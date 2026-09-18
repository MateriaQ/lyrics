import { t } from "elysia";
import { createRouter } from "@/utils/app";

export const indexRouter = createRouter({ name: "root" })
  .get("/", ({ redirect }) => redirect("/docs", "302"), {
    detail: {
      summary: "Root Check",
      tags: ["System"],
    },
  })
  .get("/ping", () => "pong", {
    detail: {
      summary: "Heartbeat",
      tags: ["System"],
    },
    response: t.String(),
  });
