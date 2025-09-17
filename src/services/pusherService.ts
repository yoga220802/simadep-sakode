import Pusher from "pusher-js";
import type { User } from "../types/auth";

class PusherService {
    private pusher: Pusher | null = null;
    private static instance: PusherService;

    private constructor() { }

    public static getInstance(): PusherService {
        if (!PusherService.instance) {
            PusherService.instance = new PusherService();
        }
        return PusherService.instance;
    }

    connect(user: User, token: string): Pusher {
        if (this.pusher) {
            return this.pusher;
        }

        // Ambil kredensial dari environment variables
        const PUSHER_APP_KEY = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
        const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

        if (!PUSHER_APP_KEY || !PUSHER_CLUSTER) {
            console.error("Pusher App Key or Cluster is not defined in .env.local");
            throw new Error("Konfigurasi Pusher tidak lengkap.");
        }

        // Konfigurasi disederhanakan untuk layanan cloud Pusher
        this.pusher = new Pusher(PUSHER_APP_KEY, {
            cluster: PUSHER_CLUSTER,
            authEndpoint: `${process.env.NEXT_PUBLIC_API_SMIP_BASE_URL}/v1/pusher/auth`,
            auth: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        });

        // Subscribe ke channel privat user
        const channel = this.pusher.subscribe(`private-user-${user.id}`);

        channel.bind("pusher:subscription_succeeded", () => {
            console.log(`[Pusher] Berhasil subscribe ke channel: private-user-${user.id}`);
        });

        channel.bind("pusher:subscription_error", (status: any) => {
            console.error("[Pusher] Gagal subscribe:", status);
        });

        return this.pusher;
    }

    disconnect(): void {
        if (this.pusher) {
            this.pusher.disconnect();
            this.pusher = null;
            console.log("[Pusher] Koneksi diputus.");
        }
    }
}

export const pusherService = PusherService.getInstance();

