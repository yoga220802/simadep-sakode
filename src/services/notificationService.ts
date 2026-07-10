import type { Notification } from "@/src/types/notification";
import { pusherService } from "./pusherService";
import type { User } from "../types/auth";

type NotificationListener = () => void;

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
}

class NotificationService {
    private state: NotificationState = {
        notifications: [],
        unreadCount: 0,
    };
    private listeners: Set<NotificationListener> = new Set();
    private isInitialized = false;

    constructor() {
        this.subscribe = this.subscribe.bind(this);
        this.getSnapshot = this.getSnapshot.bind(this);
        this.getServerState = this.getServerState.bind(this);
        this.addNotification = this.addNotification.bind(this);
    }

    public subscribe(listener: NotificationListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    public getSnapshot(): NotificationState {
        return this.state;
    }

    public getServerState(): NotificationState {
        return { notifications: [], unreadCount: 0 };
    }

    private notify() {
        this.listeners.forEach((listener) => listener());
    }

    public async initialize(user: User) {
        if (this.isInitialized) {
            return;
        }
        this.isInitialized = true;

        try {
            await this.refresh();
            this.notify();

            pusherService.connect();

            const channel = pusherService.subscribe(`private-user-${user.id}`);

            if (channel) {
                channel.bind("simadep.invalidate", () => {
                    this.refresh().catch(() => undefined);
                });
            }
        } catch (error) {
            console.error("Failed to initialize notification service:", error);
            this.isInitialized = false;
        }
    }

    private addNotification(newNotification: Notification) {
        if (!this.state.notifications.some((n) => n.id === newNotification.id)) {
            this.state = {
                notifications: [newNotification, ...this.state.notifications],
                unreadCount: this.state.unreadCount + (newNotification.is_read ? 0 : 1),
            };
            this.notify();
        }
    }

    public async refresh(): Promise<void> {
        const response = await fetch("/api/notifications?limit=30", {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) {
            throw new Error("Failed to fetch initial notifications.");
        }

        const data = (await response.json()) as {
            items: Notification[];
            unreadCount: number;
        };
        this.state = {
            notifications: data.items,
            unreadCount: data.unreadCount,
        };
        this.notify();
    }

    public async markAllAsRead(): Promise<void> {
        const unreadIds = this.state.notifications
            .filter((n) => !n.is_read)
            .map((n) => n.id);
        if (unreadIds.length === 0) return;

        const originalState = this.state;
        this.state = {
            notifications: this.state.notifications.map((n) => ({ ...n, is_read: true })),
            unreadCount: 0,
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
            console.error(
                "Failed to mark notifications as read on server:",
                error
            );
            this.state = originalState;
            this.notify();
        }
    }

    public disconnect() {
        if (this.isInitialized) {
            pusherService.disconnect();
            this.state = { notifications: [], unreadCount: 0 };
            this.isInitialized = false;
            this.notify();
        }
    }
}

export const notificationService = new NotificationService();

