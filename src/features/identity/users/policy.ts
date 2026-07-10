export const globalRoles = ["super_admin", "admin", "user"] as const;

export type GlobalRole = (typeof globalRoles)[number];

export function isGlobalRole(value: string): value is GlobalRole {
  return globalRoles.includes(value as GlobalRole);
}

export function isPrivilegedGlobalRole(role: string | null | undefined) {
  return role === "super_admin" || role === "admin";
}

export function assertCanManageUsers(actorRole: string | null | undefined) {
  if (!isPrivilegedGlobalRole(actorRole)) {
    throw new Error("Only super_admin or admin can manage users.");
  }
}

export function assertCanChangeGlobalRole(input: {
  actorId: string;
  actorRole: string | null | undefined;
  targetUserId: string;
  currentTargetRole: string | null | undefined;
  nextRole: GlobalRole;
  activePrivilegedUserCount: number;
}) {
  assertCanManageUsers(input.actorRole);

  if (input.actorId === input.targetUserId && input.nextRole === "user") {
    throw new Error("Admins cannot demote their own global role.");
  }

  const targetIsPrivileged = isPrivilegedGlobalRole(input.currentTargetRole);
  const nextIsPrivileged = isPrivilegedGlobalRole(input.nextRole);

  if (
    targetIsPrivileged &&
    !nextIsPrivileged &&
    input.activePrivilegedUserCount <= 1
  ) {
    throw new Error("At least one active privileged admin must remain.");
  }
}

export function assertCanBanUser(input: {
  actorId: string;
  actorRole: string | null | undefined;
  targetUserId: string;
  targetRole: string | null | undefined;
  activePrivilegedUserCount: number;
}) {
  assertCanManageUsers(input.actorRole);

  if (input.actorId === input.targetUserId) {
    throw new Error("Admins cannot ban their own account.");
  }

  if (
    isPrivilegedGlobalRole(input.targetRole) &&
    input.activePrivilegedUserCount <= 1
  ) {
    throw new Error("At least one active privileged admin must remain.");
  }
}
