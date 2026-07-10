import { describe, expect, it } from "vitest";

import { parseRealtimeChannelAccessRequest } from "./channel-auth";

const userId = "00000000-0000-4000-8000-000000000001";
const projectId = "20000000-0000-4000-8000-000000000001";
const departmentId = "10000000-0000-4000-8000-000000000001";

describe("realtime channel authorization parsing", () => {
  it("allows the authenticated user's private channel only for that user", () => {
    expect(
      parseRealtimeChannelAccessRequest(userId, `private-user-${userId}`),
    ).toEqual({ type: "user", userId });

    expect(() =>
      parseRealtimeChannelAccessRequest(userId, "private-user-other-user"),
    ).toThrow("Realtime channel is not allowed.");
  });

  it("accepts project and department private channel ids for membership checks", () => {
    expect(
      parseRealtimeChannelAccessRequest(userId, `private-project-${projectId}`),
    ).toEqual({ type: "project", projectId });

    expect(
      parseRealtimeChannelAccessRequest(
        userId,
        `private-department-${departmentId}`,
      ),
    ).toEqual({ type: "department", departmentId });
  });

  it("rejects malformed or public channel names before provider signing", () => {
    expect(() =>
      parseRealtimeChannelAccessRequest(userId, "public-project-feed"),
    ).toThrow("Realtime channel is not allowed.");
    expect(() =>
      parseRealtimeChannelAccessRequest(userId, "private-project-not-a-uuid"),
    ).toThrow("Realtime channel is not allowed.");
  });
});
