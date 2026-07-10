import type { WorkItemTask } from "../application/contracts";

export const taskStatusOptions = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export const taskPriorityOptions = ["low", "medium", "high"] as const;

export const taskSortOptions = [
  "display_order",
  "due_date",
  "start_date",
  "title",
  "created_at",
  "priority",
  "status",
] as const;

export function dateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function formatTaskDate(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function durationLabel(minutes: number | null) {
  if (minutes == null) {
    return "-";
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours ? `${hours}j ` : ""}${rest}m`;
}

export function taskHiddenFields(task: WorkItemTask) {
  return {
    taskId: task.id,
    version: String(task.version),
    milestoneId: task.milestoneId,
    name: task.name,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority ?? "",
    displayOrder: String(task.displayOrder),
    startDate: dateInputValue(task.startDate),
    dueDate: dateInputValue(task.dueDate),
    estimatedDurationMinutes:
      task.estimatedDurationMinutes == null
        ? ""
        : String(task.estimatedDurationMinutes),
    categoryId: task.categoryId ?? "",
  };
}
