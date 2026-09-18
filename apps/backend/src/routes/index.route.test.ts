import { beforeEach, describe, expect, it, vi } from "vitest";
import { indexRouter } from "@/routes/index.route";
import { checkPostgres } from "@/db";
import { checkRedis } from "@/db/redis";
import { checkMailer } from "@/emails";

const TEST_SECRET = "super-secret-token-that-is-valid-123";

vi.mock("@/env", () => ({
  default: {
    get HEALTH_SECRET() {
      return process.env.HEALTH_SECRET;
    },
    AUTH_SECRET: "super-secret-auth-token-that-is-valid-123",
    AUTH_BASE_URL: "http://localhost",
  },
}));

vi.mock("@/db", () => ({ checkPostgres: vi.fn(async () => {}) }));
vi.mock("@/db/redis", () => ({ checkRedis: vi.fn(async () => {}) }));
vi.mock("@/emails", () => ({
  checkMailer: vi.fn(async () => false),
  sendResetPasswordEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
}));

const checkPostgresMock = vi.mocked(checkPostgres);
const checkRedisMock = vi.mocked(checkRedis);
const checkMailerMock = vi.mocked(checkMailer);

describe("indexRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.HEALTH_SECRET = TEST_SECRET;
  });

  describe("GET /healthz", () => {
    it("should return 200 with 'OK'", async () => {
      const response = await indexRouter.handle(new Request("http://localhost/healthz"));

      expect(response.status).toBe(200);
      expect(await response.text()).toBe("OK");
    });
  });

  describe("GET /readyz", () => {
    it("should return 401 if x-health-token header is missing", async () => {
      const response = await indexRouter.handle(new Request("http://localhost/readyz"));

      expect(response.status).toBe(401);
      const body = (await response.json()) as { status: string; error: { code: string } };
      expect(body.status).toBe("error");
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("should return 401 when token is invalid", async () => {
      const response = await indexRouter.handle(
        new Request("http://localhost/readyz", {
          headers: { "x-health-token": "wrong-token" },
        }),
      );

      expect(response.status).toBe(401);
      const body = (await response.json()) as { status: string; error: { code: string } };
      expect(body.status).toBe("error");
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("should return 200 when all services are healthy", async () => {
      checkPostgresMock.mockResolvedValue();
      checkRedisMock.mockResolvedValue();
      checkMailerMock.mockResolvedValue(true);

      const response = await indexRouter.handle(
        new Request("http://localhost/readyz", {
          headers: { "x-health-token": TEST_SECRET },
        }),
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        status: "ok",
        services: {
          redis: "up",
          postgres: "up",
          mailer: "up",
        },
      });
    });

    it("should return 503 when a service is down or throws", async () => {
      checkPostgresMock.mockResolvedValue();
      checkRedisMock.mockRejectedValue(new Error("Redis connection refused"));
      checkMailerMock.mockResolvedValue(false);

      const response = await indexRouter.handle(
        new Request("http://localhost/readyz", {
          headers: { "x-health-token": TEST_SECRET },
        }),
      );

      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body).toEqual({
        status: "error",
        services: {
          redis: "down",
          postgres: "up",
          mailer: "down",
        },
      });
    });

    it("should return 503 when postgres throws", async () => {
      checkPostgresMock.mockRejectedValue(new Error("Postgres connection refused"));
      checkRedisMock.mockResolvedValue();
      checkMailerMock.mockResolvedValue(true);

      const response = await indexRouter.handle(
        new Request("http://localhost/readyz", {
          headers: { "x-health-token": TEST_SECRET },
        }),
      );

      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body).toEqual({
        status: "error",
        services: {
          redis: "up",
          postgres: "down",
          mailer: "up",
        },
      });
    });
  });
});
