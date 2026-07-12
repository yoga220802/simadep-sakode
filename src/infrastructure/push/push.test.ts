import { describe, expect, it, vi } from "vitest";

import { DisabledPushAdapter, FcmHttpV1PushAdapter, type PushAdapter } from ".";

describe("push adapters", () => {
  it("disabled adapter does not send", async () => {
    const adapter: PushAdapter = new DisabledPushAdapter();

    await expect(
      adapter.send({
        tokens: ["token-1"],
        title: "SIMADEP",
        body: "Ada pembaruan baru.",
      }),
    ).resolves.toEqual({ sent: 0, failed: 0, invalidTokens: [] });
  });

  it("marks invalid FCM tokens without real provider credentials", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: vi.fn().mockResolvedValue("UNREGISTERED"),
    });
    const adapter = new FcmHttpV1PushAdapter(
      {
        projectId: "project",
        accessToken: "access-token",
      },
      fetchImpl as unknown as typeof fetch,
    );

    const result = await adapter.send({
      tokens: ["token-1"],
      title: "SIMADEP",
      body: "Ada pembaruan baru.",
    });

    expect(result).toEqual({
      sent: 0,
      failed: 1,
      invalidTokens: ["token-1"],
    });
  });
});
