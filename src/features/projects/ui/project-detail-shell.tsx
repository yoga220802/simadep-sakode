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

function toDate(value: Date | string | null) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
}

function toRequiredDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function reviveWorkItems(workItems: ProjectWorkItems): ProjectWorkItems {
  const reviveTask = (
    task: ProjectWorkItems["milestones"][number]["tasks"][number],
  ): ProjectWorkItems["milestones"][number]["tasks"][number] => ({
    ...task,
    startDate: toDate(task.startDate),
    dueDate: toDate(task.dueDate),
    completedAt: toDate(task.completedAt),
    subtasks: task.subtasks.map(reviveTask),
  });

  return {
    ...workItems,
    milestones: workItems.milestones.map((milestone) => ({
      ...milestone,
      createdAt: toRequiredDate(milestone.createdAt),
      updatedAt: toRequiredDate(milestone.updatedAt),
      tasks: milestone.tasks.map(reviveTask),
    })),
  };
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
      {label}
    </div>
  );
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
  const [localWorkItems, setLocalWorkItems] =
    useState<ProjectWorkItems | null>(workItems);
  const [localReport, setLocalReport] =
    useState<ProjectReportResult | null>(projectReport);
  const [loadingTab, setLoadingTab] = useState<ProjectDetailTabKey | null>(null);
  const [tabError, setTabError] = useState<string | null>(null);

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

  useEffect(() => {
    setLocalWorkItems(workItems);
  }, [workItems]);

  useEffect(() => {
    setLocalReport(projectReport);
  }, [projectReport]);

  useEffect(() => {
    const shouldFetchWorkItems =
      (activeTab === "tasks" || activeTab === "categories") &&
      project.capabilities.canViewTasks &&
      !localWorkItems;
    const shouldFetchReport =
      activeTab === "report" &&
      project.capabilities.canViewReport &&
      !localReport;

    if (!shouldFetchWorkItems && !shouldFetchReport) {
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams();
    if (taskFilters.sortBy) params.set("sortBy", taskFilters.sortBy);
    if (taskFilters.descending) params.set("descending", taskFilters.descending);
    if (taskFilters.assignedToMe) params.set("assignedToMe", taskFilters.assignedToMe);
    if (taskFilters.status) params.set("status", taskFilters.status);
    if (taskFilters.q) params.set("q", taskFilters.q);
    const path = shouldFetchWorkItems
      ? `/api/projects/${project.id}/work-items?${params.toString()}`
      : `/api/projects/${project.id}/report`;

    setLoadingTab(activeTab);
    setTabError(null);
    fetch(path, {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error ?? "Gagal memuat data tab.");
        }
        if (shouldFetchWorkItems) {
          setLocalWorkItems(reviveWorkItems(data as ProjectWorkItems));
        } else {
          setLocalReport(data as ProjectReportResult);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setTabError(
            error instanceof Error ? error.message : "Gagal memuat data tab.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingTab(null);
        }
      });

    return () => controller.abort();
  }, [
    activeTab,
    localReport,
    localWorkItems,
    project.capabilities.canViewReport,
    project.capabilities.canViewTasks,
    project.id,
    taskFilters.assignedToMe,
    taskFilters.descending,
    taskFilters.q,
    taskFilters.sortBy,
    taskFilters.status,
  ]);

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

      {activeTab === "tasks" && localWorkItems ? (
        <ProjectTasksTab
          projectId={project.id}
          workItems={localWorkItems}
          actorId={actorId}
          filters={taskFilters}
          taskView={resolveProjectTaskViewMode(taskView)}
        />
      ) : null}
      {activeTab === "tasks" && loadingTab === "tasks" ? (
        <LoadingPanel label="Memuat daftar tugas..." />
      ) : null}

      {activeTab === "categories" && localWorkItems ? (
        <ProjectCategoriesTab projectId={project.id} workItems={localWorkItems} />
      ) : null}
      {activeTab === "categories" && loadingTab === "categories" ? (
        <LoadingPanel label="Memuat kategori tugas..." />
      ) : null}

      {activeTab === "report" && localReport ? (
        <ProjectReportPanel report={localReport} />
      ) : null}
      {activeTab === "report" && loadingTab === "report" ? (
        <LoadingPanel label="Memuat laporan project..." />
      ) : null}
      {tabError ? (
        <div className="rounded-lg border border-[var(--color-secondary)]/30 bg-white p-4 text-sm text-[var(--color-secondary)]">
          {tabError}
        </div>
      ) : null}
    </div>
  );
}
