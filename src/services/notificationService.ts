import type { Notification } from "@/src/types/notification";
import type { User } from "@/src/types/auth";
import { pusherService } from "./pusherService";

type NotificationListener = () => void;

interface NotificationState {
    notifications: Notification[];
}

class NotificationService {
    private state: NotificationState = {
        notifications: [],
    };
    private listeners: Set<NotificationListener> = new Set();

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

    // FIX: Ganti `user: any` dengan `user: User`
    public async initialize(token: string, user: User) {
        try {
            const initialNotifs = await this.fetchNotifications(token);
            this.state = { notifications: initialNotifs };
            this.notify();

            pusherService.connect(user, token);

            // ubah private-user -> user
            const channel = pusherService.subscribe(`user-${user.id}`);

            if (channel) {
                // FIX: Ganti `data: any` dengan `data: Notification`
                channel.bind("notification.sent", (data: Notification) => {
                    console.log("Notifikasi realtime diterima:", data);
                    this.addNotification(data);
                });
            }
        } catch (error) {
            console.error("Gagal menginisialisasi layanan notifikasi:", error);
        }
    }

    private addNotification(newNotification: Notification) {
        if (!this.state.notifications.some((n) => n.id === newNotification.id)) {
            // Buat objek state BARU dan array notifikasi BARU
            this.state = {
                notifications: [newNotification, ...this.state.notifications],
            };
            this.notify();
        }
    }

    private async fetchNotifications(token: string): Promise<Notification[]> {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_SMIP_BASE_URL}/v1/users/me/notification`,
            {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        if (!response.ok) {
            throw new Error("Gagal mengambil notifikasi awal.");
        }
        return response.json();
    }

    public async markAllAsRead(token: string): Promise<void> {
        const unreadIds = this.state.notifications
            .filter((n) => !n.is_read)
            .map((n) => n.id);
        if (unreadIds.length === 0) return;

        const originalState = this.state;
        // Optimistic UI update dengan state baru
        this.state = {
            notifications: this.state.notifications.map((n) => ({ ...n, is_read: true })),
        };
        this.notify();

        try {
            await Promise.all(
                unreadIds.map((id) =>
                    fetch(
                        `${process.env.NEXT_PUBLIC_API_SMIP_BASE_URL}/v1/notification/${id}/read`,
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
            console.error("Gagal menandai notifikasi sebagai telah dibaca di server:", error);
            // Rollback
            this.state = originalState;
            this.notify();
        }
    }

    public disconnect() {
        pusherService.disconnect();
    }
}

export const notificationService = new NotificationService();
