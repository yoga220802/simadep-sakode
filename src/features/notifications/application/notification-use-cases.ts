import "@/src/infrastructure/server-only";

import { and, count, desc, eq, isNull } from "drizzle-orm";

import { getDb, inTransaction, schema } from "@/src/infrastructure/db";

import {
  deviceTokenInputSchema,
  listNotificationsInputSchema,
  notificationIdInputSchema,
  revokeDeviceTokenInputSchema,
  type DeviceTokenInput,
  type ListNotificationsInput,
  type NotificationIdInput,
  type NotificationInbox,
  type NotificationInboxItem,
  type RevokeDeviceTokenInput,
} from "./contracts";

type NotificationRow = {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  createdAt: Date;
  actorId: string | null;
  actorName: string | null;
  actorImage: string | null;
  projectId: string | null;
  projectTitle: string | null;
  taskId: string | null;
  taskName: string | null;
  isRead: boolean;
  readAt: Date | null;
};

function toInboxItem(row: NotificationRow): NotificationInboxItem {
  return {
    id: row.id,
    recipient_id: row.recipientId,
    type: row.type,
    title: row.title,
    message: row.message,
    created_at: row.createdAt.toISOString(),
    actor_id: row.actorId,
    actor_name: row.actorName ?? "SIMADEP",
    actor_profile_url: row.actorImage,
    project_id: row.projectId,
    project_title: row.projectTitle,
    task_id: row.taskId,
    task_name: row.taskName,
    is_read: row.isRead,
    read_at: row.readAt?.toISOString() ?? null,
  };
}

export async function listNotificationInbox(
  userId: string,
  input: ListNotificationsInput = {},
): Promise<NotificationInbox> {
  const parsed = listNotificationsInputSchema.parse(input);

  const [rows, unreadRows] = await Promise.all([
    getDb()
      .select({
        id: schema.notifications.id,
        recipientId: schema.notifications.recipientId,
        type: schema.notifications.type,
        title: schema.notifications.title,
        message: schema.notifications.message,
        createdAt: schema.notifications.createdAt,
        actorId: schema.notifications.actorId,
        actorName: schema.user.name,
        actorImage: schema.user.image,
        projectId: schema.notifications.projectId,
        projectTitle: schema.projects.title,
        taskId: schema.notifications.taskId,
        taskName: schema.tasks.name,
        isRead: schema.notifications.isRead,
        readAt: schema.notifications.readAt,
      })
      .from(schema.notifications)
      .leftJoin(schema.user, eq(schema.user.id, schema.notifications.actorId))
      .leftJoin(schema.projects, eq(schema.projects.id, schema.notifications.projectId))
      .leftJoin(schema.tasks, eq(schema.tasks.id, schema.notifications.taskId))
      .where(eq(schema.notifications.recipientId, userId))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(parsed.limit),
    getDb()
      .select({ value: count() })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.recipientId, userId),
          eq(schema.notifications.isRead, false),
        ),
      ),
  ]);

  return {
    items: rows.map(toInboxItem),
    unreadCount: unreadRows[0]?.value ?? 0,
  };
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.recipientId, userId),
        eq(schema.notifications.isRead, false),
      ),
    );

  return row?.value ?? 0;
}

export async function markNotificationRead(
  userId: string,
  input: NotificationIdInput,
): Promise<void> {
  const parsed = notificationIdInputSchema.parse(input);

  await getDb()
    .update(schema.notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(schema.notifications.id, parsed.notificationId),
        eq(schema.notifications.recipientId, userId),
        eq(schema.notifications.isRead, false),
      ),
    );
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await getDb()
    .update(schema.notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(schema.notifications.recipientId, userId),
        eq(schema.notifications.isRead, false),
      ),
    );
}

export async function registerDeviceToken(
  userId: string,
  input: DeviceTokenInput,
): Promise<string> {
  const parsed = deviceTokenInputSchema.parse(input);
  const now = new Date();
  const tokenId = crypto.randomUUID();

  await inTransaction(async (tx) => {
    await tx
      .insert(schema.deviceTokens)
      .values({
        id: tokenId,
        userId,
        provider: "fcm",
        token: parsed.token,
        deviceName: parsed.deviceName,
        lastSeenAt: now,
      })
      .onDuplicateKeyUpdate({
        set: {
          userId,
          deviceName: parsed.deviceName,
          lastSeenAt: now,
          revokedAt: null,
          updatedAt: now,
        },
      });
  });

  return tokenId;
}

export async function revokeDeviceToken(
  userId: string,
  input: RevokeDeviceTokenInput,
): Promise<void> {
  const parsed = revokeDeviceTokenInputSchema.parse(input);

  await getDb()
    .update(schema.deviceTokens)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(schema.deviceTokens.userId, userId),
        eq(schema.deviceTokens.token, parsed.token),
        isNull(schema.deviceTokens.revokedAt),
      ),
    );
}
