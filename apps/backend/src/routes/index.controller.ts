import { timingSafeEqual } from "node:crypto";
import env from "@/env";
import { checkPostgres } from "@/db";
import { checkRedis } from "@/db/redis";
import { checkMailer } from "@/emails";
import { HTTP_CODES } from "@/lib/http";
import { API_ERRORS } from "@/utils/app";

const isAuthorized = (token?: string) => {
  if (!token || !env.HEALTH_SECRET) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(env.HEALTH_SECRET);
  return a.length === b.length && timingSafeEqual(a, b);
};

export const getReadyz = async (adminToken?: string) => {
  if (!isAuthorized(adminToken)) {
    return { code: HTTP_CODES.UNAUTHORIZED, response: API_ERRORS.UNAUTHORIZED };
  }

  const checks = [
    { name: "redis", check: checkRedis },
    { name: "postgres", check: checkPostgres },
    { name: "mailer", check: checkMailer },
  ];

  const results = await Promise.allSettled(checks.map(({ check }) => check()));

  const services: Record<string, "up" | "down"> = {};
  let healthy = true;

  results.forEach((result, i) => {
    const isUp = result.status === "fulfilled" && result.value !== false;
    services[checks[i].name] = isUp ? "up" : "down";
    if (!isUp) healthy = false;
  });

  const status = healthy ? "ok" : "error";
  return {
    code: healthy ? HTTP_CODES.OK : HTTP_CODES.SERVICE_UNAVAILABLE,
    response: { status, services },
  };
};
