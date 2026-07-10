import "@/src/infrastructure/server-only";

import { and, eq, inArray, isNull, lte, sql } from "drizzle-orm";

import { getDb, schema } from "@/src/infrastructure/db";
import { getPushAdapter, type PushAdapter } from "@/src/infrastructure/push";
import {
  getRealtimeAdapter,
  type RealtimeAdapter,
  type RealtimeInvalidationPayload,
} from "@/src/infrastructure/realtime";

export const eventsBoundary = "infrastructure.events" as const;

export type OutboxEventRecord = {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: unknown;
  status: "pending" | "processing" | "processed" | "failed";
  attemptCount: number;
  createdAt: Date;
};

export type OutboxDeliveryTargets = {
  userIds: string[];
  deviceTokens: string[];
};

export type OutboxRepository = {
  releaseStaleProcessing(staleBefore: Date): Promise<number>;
  claimDue(limit: number, now: Date): Promise<OutboxEventRecord[]>;
  markProcessed(eventId: string): Promise<void>;
  markRetry(event: OutboxEventRecord, error: Error, nextAvailableAt: Date): Promise<void>;
  markDeadLetter(event: OutboxEventRecord, error: Error): Promise<void>;
  resolveDeliveryTargets(event: OutboxEventRecord): Promise<OutboxDeliveryTargets>;
  revokeInvalidDeviceTokens(tokens: string[]): Promise<void>;
};

export class DrizzleOutboxRepository implements OutboxRepository {
  async releaseStaleProcessing(staleBefore: Date): Promise<number> {
    const result = await getDb()
      .update(schema.outboxEvents)
      .set({ status: "pending", updatedAt: new Date() })
      .where(
        and(
          eq(schema.outboxEvents.status, "processing"),
          lte(schema.outboxEvents.updatedAt, staleBefore),
        ),
      );

    return Number(result[0]?.affectedRows ?? 0);
  }

  async claimDue(limit: number, now: Date): Promise<OutboxEventRecord[]> {
    const rows = await getDb()
      .select()
      .from(schema.outboxEvents)
      .where(
        and(
          eq(schema.outboxEvents.status, "pending"),
          lte(schema.outboxEvents.availableAt, now),
        ),
      )
      .orderBy(schema.outboxEvents.createdAt)
      .limit(limit);

    if (rows.length === 0) {
      return [];
    }

    const ids = rows.map((row) => row.id);
    await getDb()
      .update(schema.outboxEvents)
      .set({
        status: "processing",
        attemptCount: sql`${schema.outboxEvents.attemptCount} + 1`,
        updatedAt: now,
      })
      .where(inArray(schema.outboxEvents.id, ids));

    return rows.map((row) => ({
      id: row.id,
      eventType: row.eventType,
      aggregateType: row.aggregateType,
      aggregateId: row.aggregateId,
      payload: row.payload,
      status: "processing",
      attemptCount: row.attemptCount + 1,
      createdAt: row.createdAt,
    }));
  }

  async markProcessed(eventId: string): Promise<void> {
    await getDb()
      .update(schema.outboxEvents)
      .set({
        status: "processed",
        processedAt: new Date(),
        lastError: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.outboxEvents.id, eventId));
  }

  async markRetry(
    event: OutboxEventRecord,
    error: Error,
    nextAvailableAt: Date,
  ): Promise<void> {
    await getDb()
      .update(schema.outboxEvents)
      .set({
        status: "pending",
        availableAt: nextAvailableAt,
        lastError: error.message,
        updatedAt: new Date(),
      })
      .where(eq(schema.outboxEvents.id, event.id));
  }

  async markDeadLetter(event: OutboxEventRecord, error: Error): Promise<void> {
    await getDb()
      .update(schema.outboxEvents)
      .set({
        status: "failed",
        lastError: error.message,
        updatedAt: new Date(),
      })
      .where(eq(schema.outboxEvents.id, event.id));
  }

  async resolveDeliveryTargets(event: OutboxEventRecord): Promise<OutboxDeliveryTargets> {
    const payload = asPayloadObject(event.payload);
    const userIds = new Set<string>();

    if (payload.actorId) {
      userIds.delete(payload.actorId);
    }

    if (payload.projectId) {
      const rows = await getDb()
        .select({ userId: schema.projectMembers.userId })
        .from(schema.projectMembers)
        .where(eq(schema.projectMembers.projectId, payload.projectId));

      for (const row of rows) {
        userIds.add(row.userId);
      }
    }

    if (payload.departmentId) {
      const rows = await getDb()
        .select({ userId: schema.departmentMembers.userId })
        .from(schema.departmentMembers)
        .where(
          and(
            eq(schema.departmentMembers.departmentId, payload.departmentId),
            eq(schema.departmentMembers.status, "active"),
          ),
        );

      for (const row of rows) {
        userIds.add(row.userId);
      }
    }

    if (payload.actorId) {
      userIds.delete(payload.actorId);
    }

    const userIdList = [...userIds];
    if (userIdList.length === 0) {
      return { userIds: [], deviceTokens: [] };
    }

    const tokenRows = await getDb()
      .select({ token: schema.deviceTokens.token })
      .from(schema.deviceTokens)
      .where(
        and(
          inArray(schema.deviceTokens.userId, userIdList),
          isNull(schema.deviceTokens.revokedAt),
        ),
      );

    return {
      userIds: userIdList,
      deviceTokens: tokenRows.map((row) => row.token),
    };
  }

  async revokeInvalidDeviceTokens(tokens: string[]): Promise<void> {
    const uniqueTokens = [...new Set(tokens)].filter(Boolean);
    if (uniqueTokens.length === 0) {
      return;
    }

    await getDb()
      .update(schema.deviceTokens)
      .set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(inArray(schema.deviceTokens.token, uniqueTokens));
  }
}

export type OutboxProcessorOptions = {
  repository?: OutboxRepository;
  realtime?: RealtimeAdapter;
  push?: PushAdapter;
  batchSize?: number;
  maxAttempts?: number;
  now?: Date;
};

export type OutboxProcessorResult = {
  claimed: number;
  processed: number;
  retried: number;
  failed: number;
};

type PayloadObject = {
  actorId?: string;
  projectId?: string;
  departmentId?: string;
  taskId?: string;
  resourceId?: string;
  version?: number;
};

function asPayloadObject(payload: unknown): PayloadObject {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  return payload as PayloadObject;
}

function buildInvalidationPayload(
  event: OutboxEventRecord,
): RealtimeInvalidationPayload {
  const payload = asPayloadObject(event.payload);

  return {
    eventId: event.id,
    type: event.eventType,
    projectId: payload.projectId,
    departmentId: payload.departmentId,
    taskId: payload.taskId,
    resourceId: payload.resourceId ?? event.aggregateId,
    version: payload.version,
    occurredAt: event.createdAt.toISOString(),
  };
}

function buildChannels(event: OutboxEventRecord, userIds: string[]) {
  const payload = asPayloadObject(event.payload);
  const channels = new Set<string>();

  if (payload.projectId) {
    channels.add(`private-project-${payload.projectId}`);
  }

  if (payload.departmentId) {
    channels.add(`private-department-${payload.departmentId}`);
  }

  for (const userId of userIds) {
    channels.add(`private-user-${userId}`);
  }

  return [...channels];
}

function retryAt(now: Date, attemptCount: number) {
  const delaySeconds = Math.min(300, 2 ** Math.max(0, attemptCount - 1) * 15);
  return new Date(now.getTime() + delaySeconds * 1000);
}

async function deliverOutboxEvent(input: {
  event: OutboxEventRecord;
  repository: OutboxRepository;
  realtime: RealtimeAdapter;
  push: PushAdapter;
}) {
  const targets = await input.repository.resolveDeliveryTargets(input.event);
  const invalidationPayload = buildInvalidationPayload(input.event);
  const channels = buildChannels(input.event, targets.userIds);

  await input.realtime.publish({
    channels,
    eventName: "simadep.invalidate",
    payload: invalidationPayload,
  });

  if (targets.deviceTokens.length > 0) {
    const result = await input.push.send({
      tokens: targets.deviceTokens,
      title: "SIMADEP",
      body: "Ada pembaruan baru.",
      data: {
        eventId: invalidationPayload.eventId,
        type: invalidationPayload.type,
        projectId: invalidationPayload.projectId ?? "",
        departmentId: invalidationPayload.departmentId ?? "",
        taskId: invalidationPayload.taskId ?? "",
      },
    });

    await input.repository.revokeInvalidDeviceTokens(result.invalidTokens);
  }
}

export async function processOutboxBatch(
  options: OutboxProcessorOptions = {},
): Promise<OutboxProcessorResult> {
  const repository = options.repository ?? new DrizzleOutboxRepository();
  const realtime = options.realtime ?? getRealtimeAdapter();
  const push = options.push ?? getPushAdapter();
  const batchSize = options.batchSize ?? 20;
  const maxAttempts = options.maxAttempts ?? 5;
  const now = options.now ?? new Date();
  const staleBefore = new Date(now.getTime() - 10 * 60 * 1000);

  await repository.releaseStaleProcessing(staleBefore);
  const events = await repository.claimDue(batchSize, now);
  const result: OutboxProcessorResult = {
    claimed: events.length,
    processed: 0,
    retried: 0,
    failed: 0,
  };

  for (const event of events) {
    try {
      await deliverOutboxEvent({ event, repository, realtime, push });
      await repository.markProcessed(event.id);
      result.processed += 1;
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Unknown outbox delivery error.");

      if (event.attemptCount >= maxAttempts) {
        await repository.markDeadLetter(event, normalizedError);
        result.failed += 1;
      } else {
        await repository.markRetry(event, normalizedError, retryAt(now, event.attemptCount));
        result.retried += 1;
      }
    }
  }

  return result;
}
