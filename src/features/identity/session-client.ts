"use client";

import { authClient } from "./auth-client";

export type SessionDisplayUser = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Project Manager" | "Team Member" | "Viewer";
  position: string;
  profile_url?: string | null;
};

export function mapGlobalRoleToDisplayRole(
  role: string | null | undefined,
): SessionDisplayUser["role"] {
  if (role === "super_admin" || role === "admin") {
    return "Admin";
  }

  return "Team Member";
}

export function useSessionUser() {
  const session = authClient.useSession();
  const user = session.data?.user
    ? {
        id: session.data.user.id,
        name: session.data.user.name,
        email: session.data.user.email,
        role: mapGlobalRoleToDisplayRole(session.data.user.role),
        position: "",
        profile_url: session.data.user.image,
      }
    : null;

  return {
    ...session,
    user,
  };
}
