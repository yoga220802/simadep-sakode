import type { Notification } from "@/src/types/notification";
import { pusherService } from "./pusherService";

type NotificationListener = (notifications: Notification[]) => void;

class NotificationService {
    private notifications: Notification[] = [];
    private listeners: NotificationListener[] = [];
    private isInitialized = false;

    private readonly baseUrl: string | undefined;

    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_API_SMIP_BASE_URL;
    }

    private getHeaders(token: string) {
        return {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        };
    }

    public async initialize(token: string, userId: string): Promise<void> {
        if (this.isInitialized) return;

        try {
            // 1. Ambil notifikasi awal
            await this.fetchNotifications(token);

            // 2. Setup koneksi Pusher
            const pusher = pusherService.connect({ id: userId } as any, token);
            // Gunakan `private-user-` sesuai standar Pusher untuk otentikasi
            const channel = pusher.subscribe(`private-user-${userId}`);

            // 3. Bind event untuk notifikasi baru dengan nama yang benar
            channel.bind("notification.sent", (data: Notification) => {
                this.addNotification(data);
            });

            this.isInitialized = true;
            console.log("[NotificationService] Berhasil diinisialisasi.");
        } catch (error) {
            console.error("[NotificationService] Gagal inisialisasi:", error);
            this.isInitialized = false; // Coba lagi nanti jika gagal
        }
    }

    private async fetchNotifications(token: string): Promise<void> {
        const response = await fetch(
            `${this.baseUrl}/v1/users/me/notification?limit=50`,
            {
                headers: this.getHeaders(token),
            }
        );
        if (!response.ok) {
            console.error("Gagal mengambil notifikasi awal.");
            return;
        }
        const data: Notification[] = await response.json();
        this.notifications = data;
        this._notify();
    }

    private addNotification(notification: Notification) {
        // Tambahkan notifikasi baru ke paling atas
        this.notifications = [notification, ...this.notifications];
        this._notify();
    }

    public async markAsRead(token: string, notificationId: number) {
        const notification = this.notifications.find((n) => n.id === notificationId);
        if (notification && !notification.is_read) {
            notification.is_read = true;
            this._notify(); // Update UI langsung

            try {
                await fetch(
                    `${this.baseUrl}/v1/notification/${notificationId}/read`,
                    {
                        method: "PATCH",
                        headers: this.getHeaders(token),
                    }
                );
            } catch (error) {
                console.error("Gagal menandai notifikasi sebagai terbaca di server:", error);
                // Jika gagal, kembalikan statusnya
                notification.is_read = false;
                this._notify();
            }
        }
    }

    public subscribe(listener: NotificationListener): void {
        this.listeners.push(listener);
        listener([...this.notifications]); // Kirim data awal saat subscribe
    }

    public unsubscribe(listener: NotificationListener): void {
        this.listeners = this.listeners.filter((l) => l !== listener);
    }

    private _notify(): void {
        this.listeners.forEach((listener) => listener([...this.notifications]));
    }

    public disconnect() {
        pusherService.disconnect();
        this.isInitialized = false;
        this.notifications = [];
        this.listeners = [];
    }
}

export const notificationService = new NotificationService();

