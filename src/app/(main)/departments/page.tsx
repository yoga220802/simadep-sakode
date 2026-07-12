import { redirect } from "next/navigation";

import { getServerSession } from "@/src/infrastructure/auth";
import {
  getDepartmentActor,
  listDepartmentAssignableUsers,
  listDepartmentMembersForActor,
  listDepartmentsForActor,
} from "@/src/features/departments/application/department-use-cases";
import { DepartmentsManagementView } from "@/src/features/departments/ui/departments-management-view";
import type { DepartmentMemberItem } from "@/src/features/departments/application/contracts";
import { isGlobalDepartmentAdmin } from "@/src/features/departments/domain/department-policy";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
  }>;
};

export default async function DepartmentsPage({ searchParams }: PageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const actor = await getDepartmentActor(session.user.id);
  const departments = await listDepartmentsForActor(actor, {
    query: params?.q,
    status: params?.status === "archived" ? "archived" : "active",
  });
  const users = await listDepartmentAssignableUsers(actor);
  const memberEntries: Array<[string, DepartmentMemberItem[]]> =
    await Promise.all(
      departments.map(async (department) => [
        department.id,
        await listDepartmentMembersForActor(actor, department.id),
      ]),
    );
  const membersByDepartment = new Map(memberEntries);
  const canCreateDepartment = isGlobalDepartmentAdmin(actor.globalRole);

  return (
    <DepartmentsManagementView
      departments={departments}
      membersByDepartment={Object.fromEntries(membersByDepartment)}
      users={users}
      filters={{ q: params?.q, status: params?.status }}
      canCreateDepartment={canCreateDepartment}
    />
  );
}
