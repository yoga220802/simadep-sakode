"use client";

import { useEffect, useState } from "react";

import type { ProjectReportResult } from "@/src/features/reporting";
import { ProjectReportPanel } from "@/src/features/reporting/ui/project-report-panel";
import type { ProjectWorkItems } from "@/src/features/work-items";
import { ProjectCategoriesTab } from "@/src/features/work-items/ui/project-categories-tab";
import { ProjectTasksTab } from "@/src/features/work-items/ui/project-tasks-tab";
import { resolveProjectTaskViewMode } from "@/src/features/work-items/ui/project-task-view-mode";
import type { ProjectDetail } from "../application/contracts";
import { ProjectDetailHeader } from "./project-detail-header";
import { ProjectDetailTab } from "./project-detail-tab";
import {
  getVisibleProjectTabs,
  normalizeProjectTab,
  type ProjectDetailTabKey,
} from "./project-tabs";

type ProjectDetailShellProps = {
  project: ProjectDetail;
  initialTab: ProjectDetailTabKey;
  actorId: string;
  workItems: ProjectWorkItems | null;
  projectReport: ProjectReportResult | null;
  taskFilters: {
    sortBy?: string;
    descending?: string;
    assignedToMe?: string;
    status?: string;
    q?: string;
  };
  taskView?: string;
};

function resolveVisibleTab(project: ProjectDetail, tab: string | undefined) {
  const requested = normalizeProjectTab(tab);
  const visibleTabs = getVisibleProjectTabs(project.capabilities);
  return visibleTabs.some((item) => item.key === requested) ? requested : "detail";
}

function readTabFromLocation(project: ProjectDetail) {
  if (typeof window === "undefined") {
    return "detail";
  }

  const params = new URLSearchParams(window.location.search);
  return resolveVisibleTab(project, params.get("tab") ?? undefined);
}

export function ProjectDetailShell({
  project,
  initialTab,
  actorId,
  workItems,
  projectReport,
  taskFilters,
  taskView,
}: ProjectDetailShellProps) {
  const [activeTab, setActiveTab] = useState<ProjectDetailTabKey>(initialTab);

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(readTabFromLocation(project));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [project]);

  function changeTab(nextTab: ProjectDetailTabKey) {
    const tab = resolveVisibleTab(project, nextTab);
    setActiveTab(tab);

    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.pushState(null, "", `${url.pathname}?${url.searchParams.toString()}`);
  }

  return (
    <div className="space-y-6">
      <ProjectDetailHeader
        project={project}
        activeTab={activeTab}
        onTabChange={changeTab}
      />

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
          actorId={actorId}
          filters={taskFilters}
          taskView={resolveProjectTaskViewMode(taskView)}
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
