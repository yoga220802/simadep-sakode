import { describe, expect, it } from "vitest";

import {
  assertCanAddProjectMember,
  assertCanChangeProjectMemberRole,
  assertCanCreateProject,
  assertCanManageProjectMembers,
  assertCanRemoveProjectMember,
  assertCanViewProject,
  assertOptimisticVersion,
  canManageProject,
  type ProjectActor,
} from "../domain/project-policy";

const project = {
  id: "20000000-0000-4000-8000-000000000001",
  departmentId: "10000000-0000-4000-8000-000000000001",
};

const viewerActor: ProjectActor = {
  id: "00000000-0000-4000-8000-000000000001",
  globalRole: "user",
  departmentMemberships: [],
  projectMemberships: [{ projectId: project.id, role: "viewer" }],
};

const ownerActor: ProjectActor = {
  id: "00000000-0000-4000-8000-000000000002",
  globalRole: "user",
  departmentMemberships: [],
  projectMemberships: [{ projectId: project.id, role: "owner" }],
};

describe("project policy denied paths", () => {
  it("blocks out-of-scope reads and creates", () => {
    expect(() =>
      assertCanViewProject(
        { ...viewerActor, projectMemberships: [] },
        project,
      ),
    ).toThrow("You do not have access to this project.");

    expect(() =>
      assertCanCreateProject(viewerActor, project.departmentId),
    ).toThrow("You cannot create projects in this department.");
  });

  it("allows owners to manage and blocks viewers", () => {
    expect(canManageProject(ownerActor, project)).toBe(true);
    expect(canManageProject(viewerActor, project)).toBe(false);
  });

  it("denies member management for project viewers", () => {
    expect(() => assertCanManageProjectMembers(viewerActor, project)).toThrow(
      "You cannot manage this project.",
    );
  });

  it("protects project owners from generic member removal or role change", () => {
    expect(() =>
      assertCanRemoveProjectMember({
        actorId: ownerActor.id,
        targetUserId: ownerActor.id,
        targetRole: "owner",
      }),
    ).toThrow("Project members cannot remove themselves.");

    expect(() =>
      assertCanRemoveProjectMember({
        actorId: "00000000-0000-4000-8000-000000000003",
        targetUserId: ownerActor.id,
        targetRole: "owner",
      }),
    ).toThrow("Project owners cannot be removed through generic member removal.");

    expect(() =>
      assertCanChangeProjectMemberRole({
        actorId: "00000000-0000-4000-8000-000000000003",
        targetUserId: ownerActor.id,
        currentRole: "owner",
        nextRole: "manager",
      }),
    ).toThrow("Project owner role cannot be changed through generic member update.");
  });

  it("requires global admins to be assigned owner role", () => {
    expect(() =>
      assertCanAddProjectMember({
        targetGlobalRole: "admin",
        nextRole: "contributor",
      }),
    ).toThrow("Global admins can only be assigned as project owners.");
  });

  it("rejects stale optimistic versions", () => {
    expect(() =>
      assertOptimisticVersion({
        currentVersion: 3,
        expectedVersion: 2,
      }),
    ).toThrow("Project was updated by another session. Refresh and try again.");
  });
});
