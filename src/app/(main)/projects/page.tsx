import { redirect } from "next/navigation";

import { getServerSession } from "@/src/infrastructure/auth";
import {
  getProjectActor,
  listProjectDepartmentsForActor,
  listProjectsForActor,
} from "@/src/features/projects/application/project-use-cases";
import { canCreateProject } from "@/src/features/projects/domain/project-policy";
import { ProjectListView } from "@/src/features/projects/ui/project-list-view";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    page?: string;
    q?: string;
    status?: string;
    departmentId?: string;
    startDate?: string;
    endDate?: string;
  }>;
};

export default async function ProjectsPage({ searchParams }: PageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const actor = await getProjectActor(session.user.id);
  const departments = await listProjectDepartmentsForActor(actor);
  const page = await listProjectsForActor(actor, {
    page: params?.page,
    search: params?.q,
    status:
      params?.status === "tender" ||
      params?.status === "active" ||
      params?.status === "completed" ||
      params?.status === "cancelled"
        ? params.status
        : undefined,
    departmentId: params?.departmentId || undefined,
    startDate: params?.startDate || undefined,
    endDate: params?.endDate || undefined,
  });
  const canCreate = departments.some((department) =>
    canCreateProject(actor, department.id),
  );

  return (
    <ProjectListView
      page={page}
      departments={departments}
      canCreate={canCreate}
      currentFilters={{
        q: params?.q,
        status: params?.status,
        departmentId: params?.departmentId,
        startDate: params?.startDate,
        endDate: params?.endDate,
      }}
    />
  );
}
