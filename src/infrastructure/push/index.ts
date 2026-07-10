import "@/src/infrastructure/server-only";

import { getServerEnv } from "@/src/infrastructure/env";

export const pushBoundary = "infrastructure.push" as const;

export type PushMessage = {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
};

export type PushDeliveryResult = {
  sent: number;
  failed: number;
  invalidTokens: string[];
};

export type PushAdapter = {
  send(message: PushMessage): Promise<PushDeliveryResult>;
};

export class DisabledPushAdapter implements PushAdapter {
  async send(): Promise<PushDeliveryResult> {
    return { sent: 0, failed: 0, invalidTokens: [] };
  }
}

export class FcmHttpV1PushAdapter implements PushAdapter {
  constructor(
    private readonly config: {
      projectId: string;
      accessToken: string;
    },
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async send(message: PushMessage): Promise<PushDeliveryResult> {
    const tokens = [...new Set(message.tokens)].filter(Boolean);
    const result: PushDeliveryResult = { sent: 0, failed: 0, invalidTokens: [] };

    for (const token of tokens) {
      const response = await this.fetchImpl(
        `https://fcm.googleapis.com/v1/projects/${this.config.projectId}/messages:send`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${this.config.accessToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token,
              notification: {
                title: message.title,
                body: message.body,
              },
              data: message.data,
            },
          }),
        },
      );

      if (response.ok) {
        result.sent += 1;
        continue;
      }

      result.failed += 1;
      const errorText = await response.text();
      if (
        response.status === 404 ||
        response.status === 400 ||
        errorText.includes("UNREGISTERED") ||
        errorText.includes("INVALID_ARGUMENT")
      ) {
        result.invalidTokens.push(token);
      }
    }

    return result;
  }
}

export function getPushAdapter(): PushAdapter {
  const env = getServerEnv();

  if (!env.FCM_PROJECT_ID || !env.FCM_ACCESS_TOKEN) {
    return new DisabledPushAdapter();
  }

  return new FcmHttpV1PushAdapter({
    projectId: env.FCM_PROJECT_ID,
    accessToken: env.FCM_ACCESS_TOKEN,
  });
}
