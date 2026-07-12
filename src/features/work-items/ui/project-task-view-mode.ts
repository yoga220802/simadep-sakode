export const projectTaskViewModes = ["list", "kanban", "gantt"] as const;

export type ProjectTaskViewMode = (typeof projectTaskViewModes)[number];

export function resolveProjectTaskViewMode(
  value: string | undefined,
): ProjectTaskViewMode {
  return projectTaskViewModes.includes(value as ProjectTaskViewMode)
    ? (value as ProjectTaskViewMode)
    : "list";
}
