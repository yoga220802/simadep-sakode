import { describe, expect, it, vi } from "vitest";

import {
  processOutboxBatch,
  type OutboxDeliveryTargets,
  type OutboxEventRecord,
  type OutboxRepository,
} from ".";
import type { PushAdapter } from "@/src/infrastructure/push";
import type { RealtimeAdapter } from "@/src/infrastructure/realtime";

function event(overrides: Partial<OutboxEventRecord> = {}): OutboxEventRecord {
  return {
    id: "evt-1",
    eventType: "task.updated.v1",
    aggregateType: "task",
    aggregateId: "task-1",
    payload: {
      actorId: "user-actor",
      projectId: "project-1",
      taskId: "task-1",
      resourceId: "task-1",
    },
    status: "processing",
    attemptCount: 1,
    createdAt: new Date("2026-07-10T00:00:00.000Z"),
    ...overrides,
  };
}

function repository(
  events: OutboxEventRecord[],
  targets: OutboxDeliveryTargets = {
    userIds: ["user-2"],
    deviceTokens: ["token-1"],
  },
): OutboxRepository {
  return {
    releaseStaleProcessing: vi.fn().mockResolvedValue(0),
    claimDue: vi.fn().mockResolvedValue(events),
    markProcessed: vi.fn().mockResolvedValue(undefined),
    markRetry: vi.fn().mockResolvedValue(undefined),
    markDeadLetter: vi.fn().mockResolvedValue(undefined),
    resolveDeliveryTargets: vi.fn().mockResolvedValue(targets),
    revokeInvalidDeviceTokens: vi.fn().mockResolvedValue(undefined),
  };
}

describe("processOutboxBatch", () => {
  it("publishes minimal invalidation payloads and marks the event processed", async () => {
    const repo = repository([event()]);
    const realtime: RealtimeAdapter = {
      publish: vi.fn().mockResolvedValue(undefined),
    };
    const push: PushAdapter = {
      send: vi.fn().mockResolvedValue({
        sent: 1,
        failed: 0,
        invalidTokens: [],
      }),
    };

    const result = await processOutboxBatch({
      repository: repo,
      realtime,
      push,
      now: new Date("2026-07-10T00:01:00.000Z"),
    });

    expect(result).toEqual({ claimed: 1, processed: 1, retried: 0, failed: 0 });
    expect(realtime.publish).toHaveBeenCalledWith({
      channels: ["private-project-project-1", "private-user-user-2"],
      eventName: "simadep.invalidate",
      payload: {
        eventId: "evt-1",
        type: "task.updated.v1",
        projectId: "project-1",
        departmentId: undefined,
        taskId: "task-1",
        resourceId: "task-1",
        version: undefined,
        occurredAt: "2026-07-10T00:00:00.000Z",
      },
    });
    expect(repo.markProcessed).toHaveBeenCalledWith("evt-1");
    expect(push.send).toHaveBeenCalledWith({
      tokens: ["token-1"],
      title: "SIMADEP",
      body: "Ada pembaruan baru.",
      data: {
        eventId: "evt-1",
        type: "task.updated.v1",
        projectId: "project-1",
        departmentId: "",
        taskId: "task-1",
        resourceId: "task-1",
      },
    });
  });

  it("uses collaboration-specific FCM copy for comment events", async () => {
    const repo = repository([
      event({
        eventType: "comment.created.v1",
        aggregateType: "comment",
        aggregateId: "comment-1",
        payload: {
          actorId: "user-actor",
          projectId: "project-1",
          taskId: "task-1",
          resourceId: "comment-1",
        },
      }),
    ]);
    const realtime: RealtimeAdapter = {
      publish: vi.fn().mockResolvedValue(undefined),
    };
    const push: PushAdapter = {
      send: vi.fn().mockResolvedValue({
        sent: 1,
        failed: 0,
        invalidTokens: [],
      }),
    };

    await processOutboxBatch({
      repository: repo,
      realtime,
      push,
      now: new Date("2026-07-10T00:01:00.000Z"),
    });

    expect(push.send).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Komentar tugas baru",
        body: "Ada komentar baru di tugas project.",
      }),
    );
  });

  it("retries provider failures before the max attempt limit", async () => {
    const repo = repository([event({ attemptCount: 2 })]);
    const realtime: RealtimeAdapter = {
      publish: vi.fn().mockRejectedValue(new Error("provider down")),
    };
    const push: PushAdapter = {
      send: vi.fn(),
    };

    const result = await processOutboxBatch({
      repository: repo,
      realtime,
      push,
      maxAttempts: 5,
      now: new Date("2026-07-10T00:01:00.000Z"),
    });

    expect(result.retried).toBe(1);
    expect(repo.markRetry).toHaveBeenCalled();
    expect(repo.markDeadLetter).not.toHaveBeenCalled();
  });

  it("marks events failed as a dead letter after the max attempt limit", async () => {
    const repo = repository([event({ attemptCount: 5 })]);
    const realtime: RealtimeAdapter = {
      publish: vi.fn().mockRejectedValue(new Error("provider down")),
    };
    const push: PushAdapter = {
      send: vi.fn(),
    };

    const result = await processOutboxBatch({
      repository: repo,
      realtime,
      push,
      maxAttempts: 5,
      now: new Date("2026-07-10T00:01:00.000Z"),
    });

    expect(result.failed).toBe(1);
    expect(repo.markDeadLetter).toHaveBeenCalled();
  });
});
