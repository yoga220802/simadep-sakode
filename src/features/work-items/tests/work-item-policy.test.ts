import { describe, expect, it } from "vitest";

import type { ProjectActor } from "@/src/features/projects";
import {
  assertAssigneeIsProjectMember,
  assertCanManageWorkItems,
  assertCanUseAssignedStatusAction,
  assertOptimisticTaskVersion,
  assertTaskRelationProject,
} from "../index";
import { completionFields } from "../application/work-item-internals";

const baseActor: ProjectActor = {
  id: "user-1",
  globalRole: "user",
  departmentMemberships: [],
  projectMemberships: [{ projectId: "project-1", role: "contributor" }],
};

describe("work item policy", () => {
  it("allows owner or manager to manage work items", () => {
    const actor: ProjectActor = {
      ...baseActor,
      projectMemberships: [{ projectId: "project-1", role: "manager" }],
    };

    expect(() =>
      assertCanManageWorkItems(actor, {
        id: "project-1",
        departmentId: "department-1",
      }),
    ).not.toThrow();
  });

  it("denies contributors from generic work item management", () => {
    expect(() =>
      assertCanManageWorkItems(baseActor, {
        id: "project-1",
        departmentId: "department-1",
      }),
    ).toThrow("You cannot manage work items");
  });

  it("allows assigned contributor to use the dedicated status action", () => {
    expect(() =>
      assertCanUseAssignedStatusAction({
        actor: baseActor,
        project: { id: "project-1", departmentId: "department-1" },
        assigneeUserIds: ["user-1"],
      }),
    ).not.toThrow();
  });

  it("denies unassigned contributor status changes", () => {
    expect(() =>
      assertCanUseAssignedStatusAction({
        actor: baseActor,
        project: { id: "project-1", departmentId: "department-1" },
        assigneeUserIds: ["user-2"],
      }),
    ).toThrow("Only assigned users");
  });

  it("requires assignees to be project members", () => {
    expect(() =>
      assertAssigneeIsProjectMember({
        targetUserId: "user-3",
        projectMemberUserIds: ["user-1", "user-2"],
      }),
    ).toThrow("Task assignee must already be a project member");
  });

  it("requires task relations to stay in one project", () => {
    expect(() =>
      assertTaskRelationProject({
        relationProjectId: "project-2",
        taskProjectId: "project-1",
        relationName: "Category",
      }),
    ).toThrow("Category must belong to the same project");
  });

  it("rejects stale task versions", () => {
    expect(() =>
      assertOptimisticTaskVersion({ currentVersion: 3, expectedVersion: 2 }),
    ).toThrow("Task was updated by another session");
  });

  it("sets completion duration when a task is completed", () => {
    const fields = completionFields({
      status: "completed",
      startedAt: new Date(Date.now() - 90 * 60000),
    });

    expect(fields.completedAt).toBeInstanceOf(Date);
    expect(fields.finishedDurationMinutes).toBeGreaterThanOrEqual(89);
  });
});
