import type {
  ProjectDetail,
  ProjectUiCapabilities,
} from "../application/contracts";

export type ProjectDetailTabKey = "detail" | "tasks" | "categories" | "report";

export const projectDetailTabs: Array<{
  key: ProjectDetailTabKey;
  label: string;
  capability: keyof ProjectUiCapabilities | "always";
}> = [
  { key: "detail", label: "Detail", capability: "always" },
  { key: "tasks", label: "Daftar Tugas", capability: "canViewTasks" },
  { key: "categories", label: "Kategori", capability: "canViewTasks" },
  { key: "report", label: "Laporan", capability: "canViewReport" },
];

export function normalizeProjectTab(tab: string | undefined): ProjectDetailTabKey {
  if (tab === "tasks" || tab === "categories" || tab === "report") {
    return tab;
  }

  return "detail";
}

export function getVisibleProjectTabs(capabilities: ProjectUiCapabilities) {
  return projectDetailTabs.filter(
    (tab) => tab.capability === "always" || capabilities[tab.capability],
  );
}

export function resolveProjectTab(input: {
  requestedTab?: string;
  capabilities: ProjectUiCapabilities;
}) {
  const requested = normalizeProjectTab(input.requestedTab);
  const visibleTabs = getVisibleProjectTabs(input.capabilities);

  return visibleTabs.some((tab) => tab.key === requested) ? requested : "detail";
}

export function getProjectTabQueryPlan(activeTab: ProjectDetailTabKey) {
  return {
    loadWorkItems: activeTab === "tasks" || activeTab === "categories",
    loadReport: activeTab === "report",
    loadCollaboration: false,
    loadAssignableUsers: false,
  };
}

export function canShowProjectMutationControls(project: ProjectDetail) {
  return (
    project.capabilities.canEditProject ||
    project.capabilities.canArchiveProject ||
    project.capabilities.canManageMembers
  );
}
