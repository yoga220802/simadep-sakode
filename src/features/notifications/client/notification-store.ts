"use client";

import Pusher, { type Channel } from "pusher-js";

import type { Notification } from "@/src/types/notification";

type NotificationListener = () => void;

type NotificationState = {
  notifications: Notification[];
  unreadCount: number;
  isLoaded: boolean;
};

const emptyNotificationState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoaded: false,
};

class NotificationStore {
  private state: NotificationState = emptyNotificationState;
  private listeners = new Set<NotificationListener>();
  private pusher: Pusher | null = null;
  private channel: Channel | null = null;
  private initializedForUserId: string | null = null;

  subscribe = (listener: NotificationListener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.state;

  getServerState = () => emptyNotificationState;

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  async refresh() {
    const response = await fetch("/api/notifications?limit=30", {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch notifications.");
    }

    const data = (await response.json()) as {
      items: Notification[];
      unreadCount: number;
    };

    this.state = {
      notifications: data.items,
      unreadCount: data.unreadCount,
      isLoaded: true,
    };
    this.notify();
  }

  async initialize(userId: string) {
    if (this.initializedForUserId === userId) {
      return;
    }

    this.disconnect();
    this.initializedForUserId = userId;

    const appKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!appKey || !cluster) {
      return;
    }

    this.pusher = new Pusher(appKey, {
      cluster,
      forceTLS: process.env.NEXT_PUBLIC_PUSHER_TLS !== "false",
      authorizer: (channel) => ({
        authorize: (socketId, callback) => {
          fetch("/api/realtime/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          })
            .then(async (res) => {
              if (!res.ok) {
                throw new Error(`Failed to authenticate Pusher: ${res.status}`);
              }
              return res.json();
            })
            .then((data) => callback(null, data))
            .catch((error: Error) => callback(error, { auth: "" }));
        },
      }),
    });

    this.channel = this.pusher.subscribe(`private-user-${userId}`);
    this.channel.bind("simadep.invalidate", () => {
      this.refresh().catch(() => undefined);
    });
  }

  async markAllAsRead() {
    if (this.state.unreadCount === 0) {
      return;
    }

    const previousState = this.state;
    this.state = {
      notifications: this.state.notifications.map((notification) => ({
        ...notification,
        is_read: true,
      })),
      unreadCount: 0,
      isLoaded: this.state.isLoaded,
    };
    this.notify();

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Failed to mark notifications as read.");
      }
    } catch (error) {
      this.state = previousState;
      this.notify();
      throw error;
    }
  }

  disconnect() {
    this.channel = null;
    this.pusher?.disconnect();
    this.pusher = null;
    this.initializedForUserId = null;
    this.state = emptyNotificationState;
    this.notify();
  }
}

export const notificationStore = new NotificationStore();
