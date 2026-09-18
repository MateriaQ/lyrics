import { t } from "elysia";
import { createRouter, ratelimit } from "@/utils/app";
import { HTTP_CODES } from "@/lib/http";
import { getReadyz } from "@/routes/index.controller";

const HealthResponse = t.Object({
  status: t.Union([t.Literal("ok"), t.Literal("error")]),
  services: t.Record(t.String(), t.Union([t.Literal("up"), t.Literal("down")])),
});

const UnauthorizedResponse = t.Object({
  status: t.Literal("error"),
  error: t.Object({
    code: t.Literal("UNAUTHORIZED"),
    message: t.String(),
  }),
});

export const indexRouter = createRouter({ name: "root" })
  .get("/", ({ redirect }) => redirect("/api/docs", "302"), {
    detail: {
      summary: "Root Check",
      tags: ["System"],
    },
  })
  .get("/healthz", async ({ status }) => status(HTTP_CODES.OK), {
    detail: {
      summary: "Health Check",
      tags: ["System"],
    },
  })
  .use(
    ratelimit({
      duration: 10_000,
      max: 8,
      scoping: "scoped",
    }),
  )
  .get(
    "/readyz",
    async ({ headers, status }) => {
      const { code, response } = await getReadyz(headers["x-health-token"]);
      return status(code, response);
    },
    {
      response: {
        [HTTP_CODES.OK]: HealthResponse,
        [HTTP_CODES.SERVICE_UNAVAILABLE]: HealthResponse,
        [HTTP_CODES.UNAUTHORIZED]: UnauthorizedResponse,
      },
      detail: {
        summary: "Readiness Check",
        tags: ["System"],
        security: [{ healthTokenAuth: [] }],
      },
    },
  );
