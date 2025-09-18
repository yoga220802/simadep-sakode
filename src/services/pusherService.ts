import Pusher, { type Channel } from "pusher-js";
import type { User } from "../types/auth";

class PusherService {
    private pusher: Pusher | null = null;
    private baseUrl = process.env.NEXT_PUBLIC_API_SMIP_BASE_URL;

    public connect(user: User, token: string): void {
        if (this.pusher || !user) {
            return;
        }

        try {
            this.pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
                cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
                authorizer: (channel) => {
                    return {
                        authorize: (socketId, callback) => {
                            fetch(`${this.baseUrl}/v1/auth/pusher`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                    socket_id: socketId,
                                    channel_name: channel.name,
                                }),
                            })
                                .then((res) => {
                                    if (!res.ok) {
                                        throw new Error(`Gagal otentikasi Pusher: ${res.status}`);
                                    }
                                    return res.json();
                                })
                                .then((data) => {
                                    callback(null, data);
                                })
                                .catch((err) => {
                                    callback(err as Error, { auth: "" });
                                });
                        },
                    };
                },
            });
        } catch (error) {
            console.error("Gagal menginisialisasi Pusher:", error);
        }
    }

    // Metode baru untuk subscribe ke channel
    public subscribe(channelName: string): Channel | null {
        if (!this.pusher) {
            console.error("Pusher belum terkoneksi.");
            return null;
        }

        const channel = this.pusher.subscribe(channelName);

        channel.bind("pusher:subscription_succeeded", () => {
            console.log(`Berhasil subscribe ke channel: ${channelName}`);
        });

        // FIX: Ganti `any` dengan `unknown` karena struktur error bisa bervariasi.
        channel.bind("pusher:subscription_error", (status: unknown) => {
            console.error(`Gagal subscribe ke channel ${channelName}:`, status);
        });

        return channel;
    }

    public disconnect(): void {
        if (this.pusher) {
            this.pusher.disconnect();
            this.pusher = null;
        }
    }
}

export const pusherService = new PusherService();
