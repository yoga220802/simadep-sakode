import AppShell from "@/src/components/dashboard/AppShell";
import type { SessionDisplayUser } from "@/src/features/identity/session-client";
import { getNavigationCapabilitiesForUser } from "@/src/features/navigation/application/navigation-capabilities";
import { requireServerSession } from "@/src/infrastructure/auth";
import { unstable_cache } from "next/cache";

const getCachedNavigationCapabilities = unstable_cache(
  async (userId: string) => getNavigationCapabilitiesForUser(userId),
  ["navigation-capabilities"],
  { revalidate: 60 },
);

function globalRoleLabel(role: string | null | undefined): string {
  if (role === "super_admin") {
    return "Super Admin";
  }

  if (role === "admin") {
    return "Admin";
  }

  return "User";
}

function toDisplayUser(sessionUser: Awaited<ReturnType<typeof requireServerSession>>["user"]): SessionDisplayUser {
  return {
    id: sessionUser.id,
    name: sessionUser.name,
    email: sessionUser.email,
    globalRole: sessionUser.role ?? null,
    roleLabel: globalRoleLabel(sessionUser.role),
    position: globalRoleLabel(sessionUser.role),
    profile_url: sessionUser.image,
  };
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireServerSession();
  const navigationCapabilities = await getCachedNavigationCapabilities(session.user.id);

  return (
    <AppShell
      navigationCapabilities={navigationCapabilities}
      user={toDisplayUser(session.user)}
    >
      {children}
    </AppShell>
  );
}
