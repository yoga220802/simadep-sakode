import "@/src/infrastructure/server-only";

import { createHash, createHmac } from "node:crypto";

import { getServerEnv } from "@/src/infrastructure/env";

export const realtimeBoundary = "infrastructure.realtime" as const;

export type RealtimeInvalidationPayload = {
  eventId: string;
  type: string;
  projectId?: string;
  departmentId?: string;
  taskId?: string;
  resourceId?: string;
  version?: number;
  occurredAt: string;
};

export type RealtimePublishInput = {
  channels: string[];
  eventName: string;
  payload: RealtimeInvalidationPayload;
};

export type RealtimeAdapter = {
  publish(input: RealtimePublishInput): Promise<void>;
};

export class DisabledRealtimeAdapter implements RealtimeAdapter {
  async publish(): Promise<void> {
    return;
  }
}

export class PusherRealtimeAdapter implements RealtimeAdapter {
  constructor(
    private readonly config: {
      appId: string;
      key: string;
      secret: string;
      cluster: string;
    },
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async publish(input: RealtimePublishInput): Promise<void> {
    const channels = [...new Set(input.channels)].filter(Boolean);

    if (channels.length === 0) {
      return;
    }

    const body = JSON.stringify({
      name: input.eventName,
      channels,
      data: JSON.stringify(input.payload),
    });
    const bodyMd5 = createHash("md5").update(body).digest("hex");
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const path = `/apps/${this.config.appId}/events`;
    const params = new URLSearchParams({
      auth_key: this.config.key,
      auth_timestamp: timestamp,
      auth_version: "1.0",
      body_md5: bodyMd5,
    });
    const signature = createHmac("sha256", this.config.secret)
      .update(`POST\n${path}\n${params.toString()}`)
      .digest("hex");

    params.set("auth_signature", signature);

    const response = await this.fetchImpl(
      `https://api-${this.config.cluster}.pusher.com${path}?${params.toString()}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      },
    );

    if (!response.ok) {
      throw new Error(`Pusher publish failed with status ${response.status}.`);
    }
  }
}

export function createPusherAuthResponse(input: {
  socketId: string;
  channelName: string;
  key: string;
  secret: string;
}) {
  const signature = createHmac("sha256", input.secret)
    .update(`${input.socketId}:${input.channelName}`)
    .digest("hex");

  return {
    auth: `${input.key}:${signature}`,
  };
}

export function getRealtimeAdapter(): RealtimeAdapter {
  const env = getServerEnv();

  if (!env.PUSHER_APP_ID || !env.PUSHER_APP_KEY || !env.PUSHER_APP_SECRET) {
    return new DisabledRealtimeAdapter();
  }

  return new PusherRealtimeAdapter({
    appId: env.PUSHER_APP_ID,
    key: env.PUSHER_APP_KEY,
    secret: env.PUSHER_APP_SECRET,
    cluster: env.PUSHER_CLUSTER,
  });
}
