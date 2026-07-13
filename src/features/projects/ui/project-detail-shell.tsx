"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ProjectReportResult } from "@/src/features/reporting";
import { ProjectReportPanel } from "@/src/features/reporting/ui/project-report-panel";
import type { ProjectWorkItems } from "@/src/features/work-items";
import { ProjectCategoriesTab } from "@/src/features/work-items/ui/project-categories-tab";
import { ProjectTasksTab } from "@/src/features/work-items/ui/project-tasks-tab";
import { resolveProjectTaskViewMode } from "@/src/features/work-items/ui/project-task-view-mode";
import {
  useProjectRealtimeInvalidation,
  type ProjectRealtimeInvalidation,
} from "@/src/shared/ui/use-project-realtime-invalidation";
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

function reviveProjectDetail(project: ProjectDetail): ProjectDetail {
  return {
    ...project,
    startDate: toDate(project.startDate),
    endDate: toDate(project.endDate),
    members: project.members.map((member) => ({
      ...member,
      createdAt: toRequiredDate(member.createdAt),
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
  const [localProject, setLocalProject] = useState<ProjectDetail>(project);
  const [activeTab, setActiveTab] = useState<ProjectDetailTabKey>(initialTab);
  const [localWorkItems, setLocalWorkItems] =
    useState<ProjectWorkItems | null>(workItems);
  const [localReport, setLocalReport] =
    useState<ProjectReportResult | null>(projectReport);
  const [loadingTab, setLoadingTab] = useState<ProjectDetailTabKey | null>(null);
  const [tabError, setTabError] = useState<string | null>(null);
  const projectRefreshTimerRef = useRef<number | null>(null);
  const workItemsRefreshTimerRef = useRef<number | null>(null);
  const reportRefreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(readTabFromLocation(localProject));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [localProject]);

  function changeTab(nextTab: ProjectDetailTabKey) {
    const tab = resolveVisibleTab(localProject, nextTab);
    setActiveTab(tab);

    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.pushState(null, "", `${url.pathname}?${url.searchParams.toString()}`);
  }

  useEffect(() => {
    setLocalProject(project);
    setLocalWorkItems(workItems);
  }, [project, workItems]);

  useEffect(() => {
    setLocalReport(projectReport);
  }, [projectReport]);

  const buildTaskQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (taskFilters.sortBy) params.set("sortBy", taskFilters.sortBy);
    if (taskFilters.descending) params.set("descending", taskFilters.descending);
    if (taskFilters.assignedToMe) params.set("assignedToMe", taskFilters.assignedToMe);
    if (taskFilters.status) params.set("status", taskFilters.status);
    if (taskFilters.q) params.set("q", taskFilters.q);
    return params.toString();
  }, [
    taskFilters.assignedToMe,
    taskFilters.descending,
    taskFilters.q,
    taskFilters.sortBy,
    taskFilters.status,
  ]);

  const refreshProjectDetail = useCallback((signal?: AbortSignal) => {
    setTabError(null);
    return fetch(`/api/projects/${localProject.id}`, {
      cache: "no-store",
      credentials: "same-origin",
      signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error ?? "Gagal memuat detail project.");
        }
        setLocalProject(reviveProjectDetail(data as ProjectDetail));
      })
      .catch((error: unknown) => {
        if (!signal?.aborted) {
          setTabError(
            error instanceof Error ? error.message : "Gagal memuat detail project.",
          );
        }
      });
  }, [localProject.id]);

  const refreshWorkItems = useCallback((signal?: AbortSignal) => {
    const query = buildTaskQuery();

    setLoadingTab((current) => current ?? activeTab);
    setTabError(null);
    return fetch(`/api/projects/${localProject.id}/work-items?${query}`, {
      cache: "no-store",
      credentials: "same-origin",
      signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error ?? "Gagal memuat data tab.");
        }
        setLocalWorkItems(reviveWorkItems(data as ProjectWorkItems));
      })
      .catch((error: unknown) => {
        if (!signal?.aborted) {
          setTabError(
            error instanceof Error ? error.message : "Gagal memuat data tab.",
          );
        }
      })
      .finally(() => {
        if (!signal?.aborted) {
          setLoadingTab(null);
        }
      });
  }, [activeTab, buildTaskQuery, localProject.id]);

  const refreshReport = useCallback((signal?: AbortSignal) => {
    setLoadingTab((current) => current ?? "report");
    setTabError(null);
    return fetch(`/api/projects/${localProject.id}/report`, {
      cache: "no-store",
      credentials: "same-origin",
      signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error ?? "Gagal memuat laporan project.");
        }
        setLocalReport(data as ProjectReportResult);
      })
      .catch((error: unknown) => {
        if (!signal?.aborted) {
          setTabError(
            error instanceof Error ? error.message : "Gagal memuat data tab.",
          );
        }
      })
      .finally(() => {
        if (!signal?.aborted) {
          setLoadingTab(null);
        }
      });
  }, [localProject.id]);

  useEffect(() => {
    const shouldFetchWorkItems =
      (activeTab === "tasks" || activeTab === "categories") &&
      localProject.capabilities.canViewTasks &&
      !localWorkItems;
    const shouldFetchReport =
      activeTab === "report" &&
      localProject.capabilities.canViewReport &&
      !localReport;

    if (!shouldFetchWorkItems && !shouldFetchReport) {
      return;
    }

    const controller = new AbortController();
    if (shouldFetchWorkItems) {
      void refreshWorkItems(controller.signal);
    } else {
      void refreshReport(controller.signal);
    }

    return () => controller.abort();
  }, [
    activeTab,
    localReport,
    localWorkItems,
    localProject.capabilities.canViewReport,
    localProject.capabilities.canViewTasks,
    refreshReport,
    refreshWorkItems,
  ]);

  const handleRealtimeInvalidation = useCallback((payload: ProjectRealtimeInvalidation) => {
    function scheduleRefresh(
      timerRef: typeof projectRefreshTimerRef,
      refresh: () => void,
    ) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        refresh();
        timerRef.current = null;
      }, 200);
    }

    const type = payload.type ?? "";
    if (type.startsWith("project.")) {
      scheduleRefresh(projectRefreshTimerRef, () => void refreshProjectDetail());
    }

    if (
      type.startsWith("task.") ||
      type.startsWith("milestone.") ||
      type.startsWith("task_category.") ||
      type.startsWith("task_status.")
    ) {
      scheduleRefresh(projectRefreshTimerRef, () => void refreshProjectDetail());
      if (activeTab === "tasks" || activeTab === "categories") {
        scheduleRefresh(workItemsRefreshTimerRef, () => void refreshWorkItems());
      }
      if (activeTab === "report") {
        scheduleRefresh(reportRefreshTimerRef, () => void refreshReport());
      }
    }
  }, [activeTab, refreshProjectDetail, refreshReport, refreshWorkItems]);

  useProjectRealtimeInvalidation(localProject.id, handleRealtimeInvalidation);

  useEffect(() => {
    return () => {
      for (const timerRef of [
        projectRefreshTimerRef,
        workItemsRefreshTimerRef,
        reportRefreshTimerRef,
      ]) {
        if (timerRef.current) {
          window.clearTimeout(timerRef.current);
        }
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <ProjectDetailHeader
        project={localProject}
        activeTab={activeTab}
        onTabChange={changeTab}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase text-gray-500">Total Tugas</p>
          <p className="text-3xl font-bold">{localProject.totalTasks}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase text-gray-500">Tugas Selesai</p>
          <p className="text-3xl font-bold">{localProject.completedTasks}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase text-gray-500">Anggota</p>
          <p className="text-3xl font-bold">{localProject.memberCount}</p>
        </div>
      </div>

      {activeTab === "detail" ? (
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <ProjectDetailTab
            key={`${localProject.id}-${localProject.version}`}
            project={localProject}
            departments={[]}
          />
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
