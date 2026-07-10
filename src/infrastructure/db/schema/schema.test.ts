import { describe, expect, it } from "vitest";

import * as schema from "./index";

describe("Drizzle schema", () => {
  it("exports the core SIMADEP tables", () => {
    expect(schema.userProfiles).toBeDefined();
    expect(schema.departments).toBeDefined();
    expect(schema.departmentMembers).toBeDefined();
    expect(schema.projects).toBeDefined();
    expect(schema.projectMembers).toBeDefined();
    expect(schema.milestones).toBeDefined();
    expect(schema.taskCategories).toBeDefined();
    expect(schema.tasks).toBeDefined();
    expect(schema.taskAssignees).toBeDefined();
    expect(schema.comments).toBeDefined();
    expect(schema.attachments).toBeDefined();
    expect(schema.notifications).toBeDefined();
    expect(schema.deviceTokens).toBeDefined();
    expect(schema.auditLogs).toBeDefined();
    expect(schema.outboxEvents).toBeDefined();
  });

  it("keeps Better Auth tables outside the manual schema", () => {
    expect(schema.betterAuthTablesManagedExternally).toBe(true);
    expect("user" in schema).toBe(false);
    expect("session" in schema).toBe(false);
    expect("account" in schema).toBe(false);
    expect("verification" in schema).toBe(false);
  });
});
