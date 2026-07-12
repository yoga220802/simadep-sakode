import { describe, expect, it } from "vitest";

import { deriveNavigationCapabilities } from "../domain/navigation-capabilities";
import type { ProjectActor } from "@/src/features/projects/domain/project-policy";

function actor(overrides: Partial<ProjectActor>): ProjectActor {
  return {
    id: "actor-1",
    globalRole: "user",
    departmentMemberships: [],
    projectMemberships: [],
    ...overrides,
  };
}

describe("navigation capabilities", () => {
  it("gives global admins system navigation", () => {
    const capabilities = deriveNavigationCapabilities(
      actor({ globalRole: "super_admin" }),
    );

    expect(capabilities).toMatchObject({
      canViewUserManagement: true,
      canViewDepartments: true,
      canViewProjects: true,
      canViewMyTasks: true,
      dashboardScope: "system",
    });
  });

  it("gives department heads department-scoped navigation", () => {
    const capabilities = deriveNavigationCapabilities(
      actor({
        departmentMemberships: [
          { departmentId: "department-1", role: "head", status: "active" },
        ],
      }),
    );

    expect(capabilities).toMatchObject({
      canViewUserManagement: false,
      canViewDepartments: true,
      canViewProjects: true,
      dashboardScope: "department",
    });
  });

  it("keeps department members contextual without fake global roles", () => {
    const capabilities = deriveNavigationCapabilities(
      actor({
        departmentMemberships: [
          { departmentId: "department-1", role: "member", status: "active" },
        ],
      }),
    );

    expect(capabilities).toMatchObject({
      canViewUserManagement: false,
      canViewDepartments: true,
      canViewProjects: true,
      dashboardScope: "user",
      globalRole: "user",
    });
  });

  it("allows project-only contributors to see projects and my tasks", () => {
    const capabilities = deriveNavigationCapabilities(
      actor({
        departmentMemberships: [],
        projectMemberships: [
          { projectId: "project-1", role: "contributor" },
        ],
      }),
    );

    expect(capabilities).toMatchObject({
      canViewDepartments: false,
      canViewProjects: true,
      canViewMyTasks: true,
      dashboardScope: "user",
      projectMembershipCount: 1,
    });
  });

  it("keeps users without memberships on dashboard and my tasks only", () => {
    const capabilities = deriveNavigationCapabilities(actor({}));

    expect(capabilities).toMatchObject({
      canViewDashboard: true,
      canViewUserManagement: false,
      canViewDepartments: false,
      canViewProjects: false,
      canViewMyTasks: true,
      dashboardScope: "user",
    });
  });
});
