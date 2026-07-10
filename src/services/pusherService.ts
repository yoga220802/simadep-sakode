import Pusher, { type Channel } from "pusher-js";

/**
 * Singleton class for managing the Pusher connection.
 * This ensures only one instance of Pusher is active throughout the app.
 */
class PusherService {
    private static instance: PusherService;
    private pusher: Pusher | null = null;

    // Private constructor to prevent direct instantiation.
    private constructor() { }

    // The static method that controls the access to the singleton instance.
    public static getInstance(): PusherService {
        if (!PusherService.instance) {
            PusherService.instance = new PusherService();
        }
        return PusherService.instance;
    }

    public connect(): void {
        if (this.pusher?.connection.state === "connected") {
            return;
        }

        const appKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
        const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

        if (!appKey || !cluster) {
            return;
        }

        try {
            this.pusher = new Pusher(appKey, {
                cluster,
                forceTLS: process.env.NEXT_PUBLIC_PUSHER_TLS !== "false",
                authorizer: (channel) => {
                    return {
                        authorize: (socketId, callback) => {
                            fetch("/api/realtime/auth", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
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
                                .then((data) => {
                                    callback(null, data);
                                })
                                .catch((err: Error) => {
                                    callback(err, { auth: "" });
                                });
                        },
                    };
                },
            });
        } catch (error) {
            console.error("Failed to initialize Pusher:", error);
        }
    }

    public subscribe(channelName: string): Channel | null {
        if (!this.pusher) {
            console.error("Pusher is not connected. Cannot subscribe.");
            return null;
        }

        const channel = this.pusher.subscribe(channelName);

        return channel;
    }

    public disconnect(): void {
        if (this.pusher) {
            this.pusher.disconnect();
            this.pusher = null;
        }
    }
}

// Export a single instance of the service
export const pusherService = PusherService.getInstance();

