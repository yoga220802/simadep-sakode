import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("health route", () => {
  it("returns public liveness without touching readiness dependencies", async () => {
    const response = await GET(new Request("http://localhost/api/health"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "ok",
      service: "simadep",
      checks: { liveness: "ok" },
    });
  });
});
