import type { Notification } from "@/src/types/notification";
import { pusherService } from "./pusherService";
import type { User } from "../types/auth";
import { API_BASE_URL } from "../config/api";

type NotificationListener = () => void;

interface NotificationState {
    notifications: Notification[];
}

class NotificationService {
    private state: NotificationState = {
        notifications: [],
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
        return { notifications: [] };
    }

    private notify() {
        this.listeners.forEach((listener) => listener());
    }

    public async initialize(token: string, user: User) {
        if (this.isInitialized) {
            return;
        }
        this.isInitialized = true;
        console.log("Initializing notification service for user:", user.id);

        try {
            const initialNotifs = await this.fetchNotifications(token);
            this.state = { notifications: initialNotifs };
            this.notify();

            // Use the singleton pusherService
            pusherService.connect(user, token);

            const channel = pusherService.subscribe(`user-${user.id}`);

            if (channel) {
                channel.bind("notification.sent", (data: Notification) => {
                    console.log("Real-time notification received:", data);
                    this.addNotification(data);
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
            };
            this.notify();
        }
    }

    private async fetchNotifications(token: string): Promise<Notification[]> {
        const response = await fetch(
            `${API_BASE_URL}/v1/users/me/notification`,
            {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        if (!response.ok) {
            throw new Error("Failed to fetch initial notifications.");
        }
        return response.json();
    }

    public async markAllAsRead(token: string): Promise<void> {
        const unreadIds = this.state.notifications
            .filter((n) => !n.is_read)
            .map((n) => n.id);
        if (unreadIds.length === 0) return;

        const originalState = this.state;
        this.state = {
            notifications: this.state.notifications.map((n) => ({ ...n, is_read: true })),
        };
        this.notify();

        try {
            await Promise.all(
                unreadIds.map((id) =>
                    fetch(
                        `${API_BASE_URL}/v1/notification/${id}/read`,
                        {
                            method: "PATCH",
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    )
                )
            );
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
            console.log("Disconnecting notification service...");
            pusherService.disconnect();
            this.state = { notifications: [] }; // Clear notifications on disconnect
            this.isInitialized = false;
            this.notify();
        }
    }
}

export const notificationService = new NotificationService();

