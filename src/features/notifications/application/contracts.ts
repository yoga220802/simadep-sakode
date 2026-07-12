import { z } from "zod";

export const listNotificationsInputSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const notificationIdInputSchema = z.object({
  notificationId: z.string().uuid(),
});

export const deviceTokenInputSchema = z.object({
  token: z.string().trim().min(20).max(512),
  deviceName: z.string().trim().max(120).optional(),
});

export const revokeDeviceTokenInputSchema = z.object({
  token: z.string().trim().min(20).max(512),
});

export type ListNotificationsInput = z.input<typeof listNotificationsInputSchema>;
export type NotificationIdInput = z.input<typeof notificationIdInputSchema>;
export type DeviceTokenInput = z.input<typeof deviceTokenInputSchema>;
export type RevokeDeviceTokenInput = z.input<typeof revokeDeviceTokenInputSchema>;

export type NotificationInboxItem = {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  actor_id: string | null;
  actor_name: string;
  actor_profile_url: string | null;
  project_id: string | null;
  project_title: string | null;
  task_id: string | null;
  task_name: string | null;
  is_read: boolean;
  read_at: string | null;
};

export type NotificationInbox = {
  items: NotificationInboxItem[];
  unreadCount: number;
};
