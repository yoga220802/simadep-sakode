import "@/src/infrastructure/server-only";

export type RealtimeChannelAccessRequest =
  | { type: "user"; userId: string }
  | { type: "project"; projectId: string }
  | { type: "department"; departmentId: string };

const uuidPattern = "[0-9a-fA-F-]{36}";

export function parseRealtimeChannelAccessRequest(
  authenticatedUserId: string,
  channelName: string,
): RealtimeChannelAccessRequest {
  if (channelName === `private-user-${authenticatedUserId}`) {
    return { type: "user", userId: authenticatedUserId };
  }

  const projectMatch = new RegExp(`^private-project-(${uuidPattern})$`).exec(
    channelName,
  );
  if (projectMatch) {
    return { type: "project", projectId: projectMatch[1] };
  }

  const departmentMatch = new RegExp(
    `^private-department-(${uuidPattern})$`,
  ).exec(channelName);
  if (departmentMatch) {
    return { type: "department", departmentId: departmentMatch[1] };
  }

  throw new Error("Realtime channel is not allowed.");
}
