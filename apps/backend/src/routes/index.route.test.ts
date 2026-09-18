import { describe, expect, it } from "vitest";
import { indexRouter } from "@/routes/index.route";

describe("indexRouter", () => {
  it("GET /ping should return 'pong' with status 200", async () => {
    const response = await indexRouter.handle(new Request("http://localhost/ping"));

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("pong");
  });
});
