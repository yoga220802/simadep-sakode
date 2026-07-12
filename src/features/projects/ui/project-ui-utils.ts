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
  tender:
    "bg-[var(--simadep-secondary-soft)] text-[var(--color-secondary)] border-[var(--color-secondary)]/25",
  active:
    "bg-[var(--simadep-primary-soft)] text-[var(--color-text-main)] border-[var(--color-primary)]/35",
  completed:
    "bg-[var(--simadep-accent-soft)] text-[var(--color-accent)] border-[var(--color-accent)]/25",
  cancelled:
    "bg-[var(--simadep-secondary-soft)] text-[var(--color-secondary)] border-[var(--color-secondary)]/35",
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
