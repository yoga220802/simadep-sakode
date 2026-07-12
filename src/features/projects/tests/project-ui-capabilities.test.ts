import { describe, expect, it } from "vitest";

import {
  getProjectUiCapabilities,
  type ProjectActor,
} from "../domain/project-policy";
import {
  canShowProjectMutationControls,
  getProjectTabQueryPlan,
  getVisibleProjectTabs,
  resolveProjectTab,
} from "../ui/project-tabs";
import type { ProjectDetail } from "../application/contracts";

const project = {
  id: "20000000-0000-4000-8000-000000000001",
  departmentId: "10000000-0000-4000-8000-000000000001",
};

function actorWithProjectRole(role: "owner" | "manager" | "contributor" | "viewer"): ProjectActor {
  return {
    id: `actor-${role}`,
    globalRole: "user",
    departmentMemberships: [],
    projectMemberships: [{ projectId: project.id, role }],
  };
}

function detailWithCapabilities(
  capabilities: ProjectDetail["capabilities"],
): ProjectDetail {
  return {
    id: project.id,
    departmentId: project.departmentId,
    departmentName: "Departemen",
    title: "Project",
    description: null,
    status: "active",
    startDate: null,
    endDate: null,
    createdBy: null,
    version: 1,
    totalTasks: 0,
    memberCount: 0,
    actorRole: "viewer",
    capabilities,
    members: [],
    completedTasks: 0,
  };
}

describe("project UI capabilities", () => {
  it("hides management affordances and report tab for project viewers", () => {
    const capabilities = getProjectUiCapabilities(
      actorWithProjectRole("viewer"),
      project,
    );

    expect(capabilities.canEditProject).toBe(false);
    expect(capabilities.canArchiveProject).toBe(false);
    expect(capabilities.canManageMembers).toBe(false);
    expect(capabilities.canViewTasks).toBe(true);
    expect(capabilities.canViewReport).toBe(false);
    expect(getVisibleProjectTabs(capabilities).map((tab) => tab.key)).toEqual([
      "detail",
      "tasks",
      "categories",
    ]);
    expect(canShowProjectMutationControls(detailWithCapabilities(capabilities))).toBe(
      false,
    );
  });

  it("allows owner and manager to see report and mutation controls", () => {
    for (const role of ["owner", "manager"] as const) {
      const capabilities = getProjectUiCapabilities(
        actorWithProjectRole(role),
        project,
      );

      expect(capabilities.canEditProject).toBe(true);
      expect(capabilities.canManageMembers).toBe(true);
      expect(capabilities.canViewReport).toBe(true);
      expect(getVisibleProjectTabs(capabilities).map((tab) => tab.key)).toEqual([
        "detail",
        "tasks",
        "categories",
        "report",
      ]);
      expect(canShowProjectMutationControls(detailWithCapabilities(capabilities))).toBe(
        true,
      );
    }
  });

  it("falls back to detail when a requested tab is not visible", () => {
    const capabilities = getProjectUiCapabilities(
      actorWithProjectRole("contributor"),
      project,
    );

    expect(resolveProjectTab({ requestedTab: "report", capabilities })).toBe(
      "detail",
    );
    expect(resolveProjectTab({ requestedTab: "tasks", capabilities })).toBe(
      "tasks",
    );
  });

  it("plans only active tab data loading", () => {
    expect(getProjectTabQueryPlan("detail")).toEqual({
      loadWorkItems: false,
      loadReport: false,
      loadCollaboration: false,
      loadAssignableUsers: false,
    });
    expect(getProjectTabQueryPlan("tasks")).toMatchObject({
      loadWorkItems: true,
      loadReport: false,
      loadCollaboration: false,
      loadAssignableUsers: false,
    });
    expect(getProjectTabQueryPlan("report")).toMatchObject({
      loadWorkItems: false,
      loadReport: true,
      loadCollaboration: false,
      loadAssignableUsers: false,
    });
  });
});
