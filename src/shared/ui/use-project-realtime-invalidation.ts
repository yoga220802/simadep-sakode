"use client";

import { useEffect } from "react";
import Pusher from "pusher-js";

export type ProjectRealtimeInvalidation = {
  type?: string;
  projectId?: string;
  departmentId?: string;
  taskId?: string;
  resourceId?: string;
  version?: number;
  eventId?: string;
  occurredAt?: string;
};

type RealtimeInvalidation = ProjectRealtimeInvalidation;

function parseInvalidationPayload(data: unknown): ProjectRealtimeInvalidation | null {
  if (typeof data === "string") {
    try {
      return parseInvalidationPayload(JSON.parse(data) as unknown);
    } catch {
      return null;
    }
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  return data as ProjectRealtimeInvalidation;
}

function usePrivateRealtimeInvalidation(
  channelName: string | null | undefined,
  onInvalidate: (payload: RealtimeInvalidation) => void,
) {
  useEffect(() => {
    if (!channelName) {
      return;
    }

    const appKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!appKey || !cluster) {
      return;
    }

    const pusher = new Pusher(appKey, {
      cluster,
      forceTLS: process.env.NEXT_PUBLIC_PUSHER_TLS !== "false",
      authorizer: (channel) => ({
        authorize: (socketId, callback) => {
          fetch("/api/realtime/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          })
            .then(async (response) => {
              if (!response.ok) {
                throw new Error(`Failed to authenticate Pusher: ${response.status}`);
              }
              return response.json();
            })
            .then((data) => callback(null, data))
            .catch((error: Error) => callback(error, { auth: "" }));
        },
      }),
    });
    const channel = pusher.subscribe(channelName);
    const handleInvalidate = (data: unknown) => {
      const payload = parseInvalidationPayload(data);
      if (payload) {
        onInvalidate(payload);
      }
    };

    channel.bind("simadep.invalidate", handleInvalidate);

    return () => {
      channel.unbind("simadep.invalidate", handleInvalidate);
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [channelName, onInvalidate]);
}

export function useProjectRealtimeInvalidation(
  projectId: string | null | undefined,
  onInvalidate: (payload: ProjectRealtimeInvalidation) => void,
) {
  usePrivateRealtimeInvalidation(
    projectId ? `private-project-${projectId}` : null,
    (payload) => {
      if (payload.projectId === projectId) {
        onInvalidate(payload);
      }
    },
  );
}

export function useUserRealtimeInvalidation(
  userId: string | null | undefined,
  onInvalidate: (payload: ProjectRealtimeInvalidation) => void,
) {
  usePrivateRealtimeInvalidation(
    userId ? `private-user-${userId}` : null,
    onInvalidate,
  );
}
