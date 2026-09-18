import { pkg } from "@/env";
import { logger } from "@/logger";

import Elysia, { type ElysiaConfig } from "elysia";
import { helmet } from "elysia-helmet";
import cors from "@elysia/cors";
import openapi from "@elysia/openapi";
import { HTTP_CODES, HTTP_PHRASES } from "@/lib/http";

import { auth } from "@/auth";
import type { Permission } from "@/auth/permissions";
import { OpenAPI } from "@/openapi";

import {
  rateLimit as elysiaRateLimit,
  type Options as ElysiaRateLimitOptions,
} from "elysia-rate-limit";
import { ratelimitGenerator } from "@/utils/ratelimit";
import { toJsonSchema } from "@valibot/to-json-schema";
import { isProd } from "@/node-env";

export const API_ERRORS = {
  NOT_FOUND: {
    status: "error",
    error: {
      code: "NOT_FOUND",
      message: HTTP_PHRASES.NOT_FOUND,
    },
  },
  SERVER_ERROR: {
    status: "error",
    error: {
      code: "SERVER_ERROR",
      message: HTTP_PHRASES.INTERNAL_SERVER_ERROR,
    },
  },
  PARSE_ERROR: {
    status: "error",
    error: {
      code: "PARSE_ERROR",
      message: "Invalid request payload format",
    },
  },
  VALIDATION_FAILED: {
    status: "error",
    error: {
      code: "VALIDATION_FAILED",
      message: "Validation failed. Please verify your request parameters",
    },
  },
  UNAUTHORIZED: {
    status: "error",
    error: {
      code: "UNAUTHORIZED",
      message: HTTP_PHRASES.UNAUTHORIZED,
    },
  },
  FORBIDDEN: (reason: string) => ({
    status: "error",
    error: {
      code: "FORBIDDEN",
      message: `${HTTP_PHRASES.FORBIDDEN}: ${reason}`,
    },
  }),
} as const;

const betterAuth = new Elysia({ name: "auth-macro" }).macro({
  auth: {
    async resolve({ request: { headers }, status }) {
      const session = await auth.api.getSession({ headers });

      if (!session) {
        return status(HTTP_CODES.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED);
      }

      return {
        user: session.user,
        session: session.session,
      };
    },
  },

  admin: {
    async resolve({ request: { headers }, status }) {
      const session = await auth.api.getSession({ headers });

      if (!session) {
        return status(HTTP_CODES.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED);
      }

      if (session.user.role !== "admin") {
        return status(HTTP_CODES.FORBIDDEN, API_ERRORS.FORBIDDEN("Admin access required"));
      }

      return {
        user: session.user,
        session: session.session,
      };
    },
  },

  role(allowedRoles: string | string[]) {
    return {
      async resolve({ request: { headers }, status }) {
        const session = await auth.api.getSession({ headers });

        if (!session) {
          return status(HTTP_CODES.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED);
        }

        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (!session.user.role || !roles.includes(session.user.role)) {
          return status(HTTP_CODES.FORBIDDEN, API_ERRORS.FORBIDDEN("Insufficient permissions"));
        }

        return {
          user: session.user,
          session: session.session,
        };
      },
    };
  },

  permissions(permissions: Permission) {
    return {
      async resolve({ request: { headers }, status }) {
        const session = await auth.api.getSession({ headers });

        if (!session) {
          return status(HTTP_CODES.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED);
        }

        try {
          const data = await auth.api.userHasPermission({
            body: {
              userId: session.user.id,
              permissions,
            },
          });

          if (!data.success) {
            return status(HTTP_CODES.FORBIDDEN, API_ERRORS.FORBIDDEN("Insufficient permissions"));
          }

          return {
            user: session.user,
            session: session.session,
          };
        } catch {
          return status(HTTP_CODES.FORBIDDEN, API_ERRORS.FORBIDDEN("Insufficient permissions"));
        }
      },
    };
  },
});

type RateLimitOptions = Partial<Omit<ElysiaRateLimitOptions, "generator">>;
export const ratelimit = (opts: RateLimitOptions) =>
  elysiaRateLimit({
    generator: ratelimitGenerator,
    ...opts,
  });

const helmetPlugin = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://fonts.googleapis.com",
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net", "blob:"],
      workerSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
});

export const createRouter = <Prefix extends string = "">(config?: ElysiaConfig<Prefix>) =>
  new Elysia(config)
    .use(
      logger.into({
        autoLogging: isProd
          ? {
              ignore(ctx) {
                if (typeof ctx.set.status !== "number") {
                  return false;
                }
                return ctx.set.status < 400;
              },
            }
          : true,
      }),
    )
    .use(betterAuth);

export const createApp = async <Prefix extends string = "">(config?: ElysiaConfig<Prefix>) =>
  createRouter(config)
    .use(helmetPlugin)
    .use(
      cors({
        origin: ["https://xpui.app.spotify.com"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: false,
        allowedHeaders: ["Content-Type", "Authorization"],
      }),
    )
    .mount(auth.handler)
    .use(
      openapi({
        path: "/docs",
        documentation: {
          components: await OpenAPI.getComponents(),
          paths: await OpenAPI.getPaths(),
          info: {
            title: "MateriaQ",
            description:
              "Fast, reliable song lyrics aggregated from multiple providers and crowdsourced community data.",
            version: pkg.version,
          },
        },
        mapJsonSchema: { valibot: toJsonSchema },
        scalar: { theme: "deepSpace", defaultOpenAllTags: true, showSidebar: true, customCss: "" },
      }),
    )

    .onError(({ code, error, status }) => {
      switch (code) {
        case "NOT_FOUND":
          return status(HTTP_CODES.NOT_FOUND, API_ERRORS.NOT_FOUND);

        case "VALIDATION":
          if (error.type === "response") {
            return status(HTTP_CODES.INTERNAL_SERVER_ERROR, API_ERRORS.SERVER_ERROR);
          }
          return status(HTTP_CODES.BAD_REQUEST, API_ERRORS.VALIDATION_FAILED);

        case "PARSE":
          return status(HTTP_CODES.BAD_REQUEST, API_ERRORS.PARSE_ERROR);

        case "INTERNAL_SERVER_ERROR":
        default:
          return status(HTTP_CODES.INTERNAL_SERVER_ERROR, API_ERRORS.SERVER_ERROR);
      }
    });
