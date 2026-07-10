import type {
  ProjectDetail,
  ProjectListItem,
  ProjectUiCapabilities,
} from "../application/contracts";
import type { ProjectStatus } from "../domain/project-policy";

export const projectStatusLabels: Record<ProjectStatus, string> = {
  tender: "Pengajuan",
  active: "Aktif",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const projectStatusClasses: Record<ProjectStatus, string> = {
  tender: "bg-yellow-100 text-yellow-800 border-yellow-200",
  active: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export type ProjectUiRecord = ProjectListItem | ProjectDetail;

export function dateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function formatProjectDate(date: Date | null) {
  if (!date) {
    return "Belum ditentukan";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function emptyProjectCapabilities(): ProjectUiCapabilities {
  return {
    canEditProject: false,
    canArchiveProject: false,
    canManageMembers: false,
    canViewTasks: false,
    canManageTasks: false,
    canManageCategories: false,
    canViewReport: false,
  };
}

export function initials(value: string | null | undefined) {
  return (value ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
