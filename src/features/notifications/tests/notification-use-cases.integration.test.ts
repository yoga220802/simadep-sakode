import { describe, expect, it } from "vitest";

import { listNotificationInbox } from "@/src/features/notifications";
import { closeDb, getDb, schema } from "@/src/infrastructure/db";

const runDbTests = process.env.RUN_DB_TESTS === "1";

describe.skipIf(!runDbTests)("notification DB integration", () => {
  it("can query persistent inbox and device token tables", async () => {
    const [notifications, deviceTokens] = await Promise.all([
      getDb().select().from(schema.notifications).limit(1),
      getDb().select().from(schema.deviceTokens).limit(1),
    ]);

    expect(Array.isArray(notifications)).toBe(true);
    expect(Array.isArray(deviceTokens)).toBe(true);

    await expect(listNotificationInbox("00000000-0000-0000-0000-000000000000")).resolves.toEqual({
      items: [],
      unreadCount: 0,
    });

    await closeDb();
  });
});
