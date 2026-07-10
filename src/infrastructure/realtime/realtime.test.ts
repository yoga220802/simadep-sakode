import { describe, expect, it, vi } from "vitest";

import {
  DisabledRealtimeAdapter,
  PusherRealtimeAdapter,
  createPusherAuthResponse,
  type RealtimeAdapter,
} from ".";

describe("realtime adapters", () => {
  it("creates deterministic Pusher private channel auth", () => {
    const response = createPusherAuthResponse({
      socketId: "123.456",
      channelName: "private-user-user-1",
      key: "key",
      secret: "secret",
    });

    expect(response.auth).toMatch(/^key:[0-9a-f]{64}$/);
  });

  it("disabled adapter is a no-op", async () => {
    const adapter: RealtimeAdapter = new DisabledRealtimeAdapter();

    await expect(
      adapter.publish({
        channels: ["private-user-user-1"],
        eventName: "simadep.invalidate",
        payload: {
          eventId: "event-1",
          type: "task.updated.v1",
          occurredAt: "2026-07-10T00:00:00.000Z",
        },
      }),
    ).resolves.toBeUndefined();
  });

  it("publishes Pusher events through fetch without real network", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 202 });
    const adapter = new PusherRealtimeAdapter(
      {
        appId: "app-id",
        key: "key",
        secret: "secret",
        cluster: "ap1",
      },
      fetchImpl as unknown as typeof fetch,
    );

    await adapter.publish({
      channels: ["private-user-user-1", "private-user-user-1"],
      eventName: "simadep.invalidate",
      payload: {
        eventId: "event-1",
        type: "task.updated.v1",
        occurredAt: "2026-07-10T00:00:00.000Z",
      },
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [, init] = fetchImpl.mock.calls[0];
    expect(JSON.parse(init.body)).toMatchObject({
      name: "simadep.invalidate",
      channels: ["private-user-user-1"],
    });
  });
});
