import type { ProjectActor } from "@/src/features/projects/domain/project-policy";
import { isGlobalProjectAdmin } from "@/src/features/projects/domain/project-policy";

export type DashboardScope = "system" | "department" | "user";

export type NavigationCapabilities = {
  canViewDashboard: boolean;
  canViewUserManagement: boolean;
  canViewDepartments: boolean;
  canViewProjects: boolean;
  canViewMyTasks: boolean;
  dashboardScope: DashboardScope;
  globalRole: string | null;
  departmentMembershipCount: number;
  projectMembershipCount: number;
};

function activeDepartmentMemberships(actor: ProjectActor) {
  return actor.departmentMemberships.filter(
    (membership) => membership.status === "active",
  );
}

function hasDepartmentLeadership(actor: ProjectActor) {
  return activeDepartmentMemberships(actor).some(
    (membership) =>
      membership.role === "head" || membership.role === "department_admin",
  );
}

export function deriveNavigationCapabilities(
  actor: ProjectActor,
): NavigationCapabilities {
  const isGlobalAdmin = isGlobalProjectAdmin(actor.globalRole);
  const activeDepartments = activeDepartmentMemberships(actor);
  const projectMembershipCount = actor.projectMemberships.length;
  const canViewDepartments = isGlobalAdmin || activeDepartments.length > 0;
  const canViewProjects =
    isGlobalAdmin || activeDepartments.length > 0 || projectMembershipCount > 0;

  return {
    canViewDashboard: true,
    canViewUserManagement: isGlobalAdmin,
    canViewDepartments,
    canViewProjects,
    canViewMyTasks: true,
    dashboardScope: isGlobalAdmin
      ? "system"
      : hasDepartmentLeadership(actor)
        ? "department"
        : "user",
    globalRole: actor.globalRole ?? null,
    departmentMembershipCount: activeDepartments.length,
    projectMembershipCount,
  };
}
