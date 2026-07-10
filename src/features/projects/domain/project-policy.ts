export const projectStatuses = ["tender", "active", "completed", "cancelled"] as const;
export const projectRoles = ["owner", "manager", "contributor", "viewer"] as const;

export type ProjectStatus = (typeof projectStatuses)[number];
export type ProjectRole = (typeof projectRoles)[number];

export type ProjectActor = {
  id: string;
  globalRole?: string | null;
  departmentMemberships: Array<{
    departmentId: string;
    role: "head" | "department_admin" | "member" | "viewer";
    status: "active" | "inactive";
  }>;
  projectMemberships: Array<{
    projectId: string;
    role: ProjectRole;
  }>;
};

export function isGlobalProjectAdmin(role?: string | null) {
  return role === "super_admin" || role === "admin";
}

export function getProjectRole(actor: ProjectActor, projectId: string) {
  return actor.projectMemberships.find((membership) => membership.projectId === projectId)
    ?.role;
}

export function getDepartmentRole(actor: ProjectActor, departmentId: string) {
  return actor.departmentMemberships.find(
    (membership) =>
      membership.departmentId === departmentId && membership.status === "active",
  )?.role;
}

export function canViewProject(
  actor: ProjectActor,
  project: { id: string; departmentId: string },
) {
  return (
    isGlobalProjectAdmin(actor.globalRole) ||
    getProjectRole(actor, project.id) != null ||
    getDepartmentRole(actor, project.departmentId) != null
  );
}

export function canCreateProject(actor: ProjectActor, departmentId: string) {
  if (isGlobalProjectAdmin(actor.globalRole)) {
    return true;
  }

  const departmentRole = getDepartmentRole(actor, departmentId);
  return departmentRole === "head" || departmentRole === "department_admin";
}

export function canManageProject(
  actor: ProjectActor,
  project: { id: string; departmentId: string },
) {
  if (isGlobalProjectAdmin(actor.globalRole)) {
    return true;
  }

  const projectRole = getProjectRole(actor, project.id);
  if (projectRole === "owner" || projectRole === "manager") {
    return true;
  }

  const departmentRole = getDepartmentRole(actor, project.departmentId);
  return departmentRole === "head" || departmentRole === "department_admin";
}

export function assertCanViewProject(
  actor: ProjectActor,
  project: { id: string; departmentId: string },
) {
  if (!canViewProject(actor, project)) {
    throw new Error("You do not have access to this project.");
  }
}

export function assertCanCreateProject(actor: ProjectActor, departmentId: string) {
  if (!canCreateProject(actor, departmentId)) {
    throw new Error("You cannot create projects in this department.");
  }
}

export function assertCanManageProject(
  actor: ProjectActor,
  project: { id: string; departmentId: string },
) {
  if (!canManageProject(actor, project)) {
    throw new Error("You cannot manage this project.");
  }
}

export function assertCanArchiveProject(
  actor: ProjectActor,
  project: { id: string; departmentId: string },
) {
  assertCanManageProject(actor, project);
}

export function assertCanManageProjectMembers(
  actor: ProjectActor,
  project: { id: string; departmentId: string },
) {
  assertCanManageProject(actor, project);
}

export function assertCanAddProjectMember(input: {
  targetGlobalRole?: string | null;
  nextRole: ProjectRole;
}) {
  if (
    (input.targetGlobalRole === "super_admin" || input.targetGlobalRole === "admin") &&
    input.nextRole !== "owner"
  ) {
    throw new Error("Global admins can only be assigned as project owners.");
  }
}

export function assertCanRemoveProjectMember(input: {
  actorId: string;
  targetUserId: string;
  targetRole: ProjectRole;
}) {
  if (input.actorId === input.targetUserId) {
    throw new Error("Project members cannot remove themselves.");
  }

  if (input.targetRole === "owner") {
    throw new Error("Project owners cannot be removed through generic member removal.");
  }
}

export function assertCanChangeProjectMemberRole(input: {
  actorId: string;
  targetUserId: string;
  currentRole: ProjectRole;
  nextRole: ProjectRole;
  targetGlobalRole?: string | null;
}) {
  if (input.actorId === input.targetUserId) {
    throw new Error("Project members cannot change their own project role.");
  }

  if (input.currentRole === "owner") {
    throw new Error("Project owner role cannot be changed through generic member update.");
  }

  assertCanAddProjectMember({
    targetGlobalRole: input.targetGlobalRole,
    nextRole: input.nextRole,
  });
}

export function assertOptimisticVersion(input: {
  currentVersion: number;
  expectedVersion: number;
}) {
  if (input.currentVersion !== input.expectedVersion) {
    throw new Error("Project was updated by another session. Refresh and try again.");
  }
}
