export const departmentRoles = [
  "head",
  "department_admin",
  "member",
  "viewer",
] as const;

export type DepartmentRole = (typeof departmentRoles)[number];

export type DepartmentActor = {
  id: string;
  globalRole?: string | null;
  memberships: Array<{
    departmentId: string;
    role: DepartmentRole;
    status: "active" | "inactive";
  }>;
};

export function isDepartmentRole(value: string): value is DepartmentRole {
  return departmentRoles.includes(value as DepartmentRole);
}

export function isGlobalDepartmentAdmin(role?: string | null) {
  return role === "super_admin" || role === "admin";
}

export function getActiveDepartmentRole(
  actor: DepartmentActor,
  departmentId: string,
) {
  return actor.memberships.find(
    (membership) =>
      membership.departmentId === departmentId && membership.status === "active",
  )?.role;
}

export function canViewDepartment(
  actor: DepartmentActor,
  departmentId: string,
) {
  return (
    isGlobalDepartmentAdmin(actor.globalRole) ||
    getActiveDepartmentRole(actor, departmentId) != null
  );
}

export function canManageDepartment(
  actor: DepartmentActor,
  departmentId: string,
) {
  if (isGlobalDepartmentAdmin(actor.globalRole)) {
    return true;
  }

  const role = getActiveDepartmentRole(actor, departmentId);
  return role === "head" || role === "department_admin";
}

export function canManageDepartmentMembers(
  actor: DepartmentActor,
  departmentId: string,
) {
  return canManageDepartment(actor, departmentId);
}

export function assertCanCreateDepartment(actor: DepartmentActor) {
  if (!isGlobalDepartmentAdmin(actor.globalRole)) {
    throw new Error("Only global admins can create departments.");
  }
}

export function assertCanViewDepartment(
  actor: DepartmentActor,
  departmentId: string,
) {
  if (!canViewDepartment(actor, departmentId)) {
    throw new Error("You do not have access to this department.");
  }
}

export function assertCanManageDepartment(
  actor: DepartmentActor,
  departmentId: string,
) {
  if (!canManageDepartment(actor, departmentId)) {
    throw new Error("You cannot manage this department.");
  }
}

export function assertCanManageDepartmentMembers(
  actor: DepartmentActor,
  departmentId: string,
) {
  if (!canManageDepartmentMembers(actor, departmentId)) {
    throw new Error("You cannot manage department members.");
  }
}

export function assertCanArchiveDepartment(
  actor: DepartmentActor,
  departmentId: string,
) {
  assertCanManageDepartment(actor, departmentId);
}

export function assertDoesNotOrphanLastHead(input: {
  targetRole: DepartmentRole;
  nextRole?: DepartmentRole;
  activeHeadCount: number;
}) {
  const removesHead =
    input.targetRole === "head" && (!input.nextRole || input.nextRole !== "head");

  if (removesHead && input.activeHeadCount <= 1) {
    throw new Error(
      "Department must keep at least one active head before member role changes.",
    );
  }
}
