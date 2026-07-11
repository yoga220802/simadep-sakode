import { redirect } from "next/navigation";

import { listManagedUsers } from "@/src/features/identity/users";
import { UsersManagementView } from "@/src/features/identity/users/ui/users-management-view";
import { getServerSession } from "@/src/infrastructure/auth";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    role?: string;
    status?: string;
  }>;
};

function includesQuery(value: string | null | undefined, query: string) {
  return value?.toLowerCase().includes(query) ?? false;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const users = await listManagedUsers({
    id: session.user.id,
    role: session.user.role,
  });

  const query = params?.q?.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    const matchesQuery =
      !query ||
      includesQuery(user.name, query) ||
      includesQuery(user.displayName, query) ||
      includesQuery(user.email, query) ||
      includesQuery(user.position, query) ||
      includesQuery(user.workUnit, query);
    const matchesRole = !params?.role || user.role === params.role;
    const matchesStatus =
      !params?.status ||
      (params.status === "active" && !user.banned) ||
      (params.status === "banned" && user.banned);

    return matchesQuery && matchesRole && matchesStatus;
  });

  return (
    <UsersManagementView
      users={filteredUsers}
      currentUserId={session.user.id}
      filters={{
        q: params?.q,
        role: params?.role,
        status: params?.status,
      }}
    />
  );
}
