"use client";

import { authClient } from "./auth-client";

export type SessionDisplayUser = {
  id: string;
  name: string;
  email: string;
  globalRole: string | null;
  roleLabel: string;
  position: string;
  profile_url?: string | null;
};

export function globalRoleLabel(
  role: string | null | undefined,
): string {
  if (role === "super_admin") {
    return "Super Admin";
  }

  if (role === "admin") {
    return "Admin";
  }

  return "User";
}

export function useSessionUser() {
  const session = authClient.useSession();
  const user = session.data?.user
    ? {
        id: session.data.user.id,
        name: session.data.user.name,
        email: session.data.user.email,
        globalRole: session.data.user.role ?? null,
        roleLabel: globalRoleLabel(session.data.user.role),
        position: globalRoleLabel(session.data.user.role),
        profile_url: session.data.user.image,
      }
    : null;

  return {
    ...session,
    user,
  };
}
