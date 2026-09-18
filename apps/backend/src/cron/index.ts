import Elysia from "elysia";
import { cron as c } from "@elysia/cron";

import { updateSpicyVersion } from "@/cron/spicy";
import { appleTokenCron, checkSpDcToken } from "@/cron/admin";

export const cron = new Elysia({ name: "cron" })
  .use(c(updateSpicyVersion))
  .use(c(appleTokenCron))
  .use(c(checkSpDcToken));
