import { notFound, redirect } from "next/navigation";

import { getServerSession } from "@/src/infrastructure/auth";
import {
  getProjectActor,
  getProjectDetailForActor,
} from "@/src/features/projects/application/project-use-cases";
import {
  resolveProjectTab,
} from "@/src/features/projects/ui/project-tabs";
import { listProjectWorkItems } from "@/src/features/work-items";
import { getProjectReportForActor } from "@/src/features/reporting";
import { ProjectDetailShell } from "@/src/features/projects/ui/project-detail-shell";

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

  const workItems =
    project.capabilities.canViewTasks
      ? await listProjectWorkItems(actor, id, {
          sortBy: query?.sortBy as never,
          descending: query?.descending === "true",
          assignedToMe: query?.assignedToMe === "true" ? true : undefined,
          status: query?.status as never,
          search: query?.q,
        })
      : null;
  const projectReport =
    project.capabilities.canViewReport
      ? await getProjectReportForActor(actor, id)
      : null;

  return (
    <ProjectDetailShell
      project={project}
      initialTab={activeTab}
      actorId={actor.id}
      workItems={workItems}
      projectReport={projectReport}
      taskFilters={{
        sortBy: query?.sortBy,
        descending: query?.descending,
        assignedToMe: query?.assignedToMe,
        status: query?.status,
        q: query?.q,
      }}
      taskView={query?.taskView}
    />
  );
}
