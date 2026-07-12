import { notFound, redirect } from "next/navigation";

import { getServerSession } from "@/src/infrastructure/auth";
import {
  getProjectActor,
  getProjectDetailForActor,
} from "@/src/features/projects/application/project-use-cases";
import {
  ProjectDetailHeader,
} from "@/src/features/projects/ui/project-detail-header";
import { ProjectDetailTab } from "@/src/features/projects/ui/project-detail-tab";
import {
  getProjectTabQueryPlan,
  resolveProjectTab,
} from "@/src/features/projects/ui/project-tabs";
import { listProjectWorkItems } from "@/src/features/work-items";
import { ProjectTasksTab } from "@/src/features/work-items/ui/project-tasks-tab";
import { resolveProjectTaskViewMode } from "@/src/features/work-items/ui/project-task-view-mode";
import { ProjectCategoriesTab } from "@/src/features/work-items/ui/project-categories-tab";
import { getProjectReportForActor } from "@/src/features/reporting";
import { ProjectReportPanel } from "@/src/features/reporting/ui/project-report-panel";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    tab?: string;
    sortBy?: string;
    descending?: string;
    assignedToMe?: string;
    status?: string;
    q?: string;
    taskView?: string;
  }>;
};

export default async function ProjectDetailPage({ params, searchParams }: PageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const query = await searchParams;
  const actor = await getProjectActor(session.user.id);
  let project;
  try {
    project = await getProjectDetailForActor(actor, id);
  } catch {
    notFound();
  }

  const activeTab = resolveProjectTab({
    requestedTab: query?.tab,
    capabilities: project.capabilities,
  });
  const queryPlan = getProjectTabQueryPlan(activeTab);

  const workItems =
    queryPlan.loadWorkItems
      ? await listProjectWorkItems(actor, id, {
          sortBy: query?.sortBy as never,
          descending: query?.descending === "true",
          assignedToMe: query?.assignedToMe === "true" ? true : undefined,
          status: query?.status as never,
          search: query?.q,
        })
      : null;
  const projectReport =
    queryPlan.loadReport
      ? await getProjectReportForActor(actor, id)
      : null;

  return (
    <div className="space-y-6">
      <ProjectDetailHeader project={project} activeTab={activeTab} />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase text-gray-500">Total Tugas</p>
          <p className="text-3xl font-bold">{project.totalTasks}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase text-gray-500">Tugas Selesai</p>
          <p className="text-3xl font-bold">{project.completedTasks}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase text-gray-500">Anggota</p>
          <p className="text-3xl font-bold">{project.memberCount}</p>
        </div>
      </div>

      {activeTab === "detail" ? (
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <ProjectDetailTab project={project} departments={[]} />
        </section>
      ) : null}
      {activeTab === "tasks" && workItems ? (
        <ProjectTasksTab
          projectId={project.id}
          workItems={workItems}
          actorId={actor.id}
          filters={{
            sortBy: query?.sortBy,
            descending: query?.descending,
            assignedToMe: query?.assignedToMe,
            status: query?.status,
            q: query?.q,
          }}
          taskView={resolveProjectTaskViewMode(query?.taskView)}
        />
      ) : null}
      {activeTab === "categories" && workItems ? (
        <ProjectCategoriesTab projectId={project.id} workItems={workItems} />
      ) : null}
      {activeTab === "report" && projectReport ? (
        <ProjectReportPanel report={projectReport} />
      ) : null}
    </div>
  );
}
