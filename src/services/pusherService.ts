import Pusher, { type Channel } from "pusher-js";
import type { User } from "../types/auth";

/**
 * Singleton class for managing the Pusher connection.
 * This ensures only one instance of Pusher is active throughout the app.
 */
class PusherService {
    private static instance: PusherService;
    private pusher: Pusher | null = null;
    private baseUrl = process.env.NEXT_PUBLIC_API_SMIP_BASE_URL;

    // Private constructor to prevent direct instantiation.
    private constructor() { }

    // The static method that controls the access to the singleton instance.
    public static getInstance(): PusherService {
        if (!PusherService.instance) {
            PusherService.instance = new PusherService();
        }
        return PusherService.instance;
    }

    public connect(user: User, token: string): void {
        if (this.pusher?.connection.state === "connected") {
            console.log("Pusher is already connected.");
            return;
        }

        console.log("Connecting to Pusher with key:", process.env.NEXT_PUBLIC_PUSHER_APP_KEY);
        try {
            this.pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
                cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
                forceTLS: true, // <-- BEST PRACTICE: Always use encrypted connection
                authorizer: (channel) => {
                    return {
                        authorize: (socketId, callback) => {
                            console.log(`[Pusher Authorizer] Authorizing channel: ${channel.name} with socketId: ${socketId}`);
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
                                .then(async (res) => {
                                    if (!res.ok) {
                                        const errorBody = await res.text();
                                        console.error(`[Pusher Authorizer] Auth request failed with status: ${res.status}`, errorBody);
                                        throw new Error(`Failed to authenticate Pusher: ${res.status}`);
                                    }
                                    return res.json();
                                })
                                .then((data) => {
                                    console.log("[Pusher Authorizer] Auth successful, data received:", data);
                                    callback(null, data);
                                })
                                .catch((err: Error) => {
                                    console.error("[Pusher Authorizer] Auth request threw an error:", err);
                                    callback(err, { auth: "" });
                                });
                        },
                    };
                },
            });

            this.pusher.connection.bind("state_change", (states: { previous: string, current: string }) => {
                console.log("[Pusher Connection] State changed from", states.previous, "to", states.current);
            });

            this.pusher.connection.bind("connected", () => {
                console.log("[Pusher Connection] Connection established successfully.");
            });

            this.pusher.connection.bind("error", (err: any) => {
                console.error("[Pusher Connection] An error occurred:", err);
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

        channel.bind("pusher:subscription_succeeded", () => {
            console.log(`Successfully subscribed to channel: ${channelName}`);
        });

        channel.bind("pusher:subscription_error", (status: number) => {
            console.error(`Failed to subscribe to channel ${channelName}. Status:`, status);
        });

        return channel;
    }

    public disconnect(): void {
        if (this.pusher) {
            console.log("Disconnecting from Pusher...");
            this.pusher.disconnect();
            this.pusher = null;
        }
    }
}

// Export a single instance of the service
export const pusherService = PusherService.getInstance();

