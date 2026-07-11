"use client";

import type { WorkItemTask } from "../application/contracts";
import { changeTaskStatusAction } from "../server/work-item-actions";
import { WorkItemActionForm } from "./work-item-action-form";
import { taskStatusOptions } from "./work-item-ui-utils";

type TaskStatusControlProps = {
  projectId: string;
  task: WorkItemTask;
  canChangeStatus: boolean;
  compact?: boolean;
};

export function TaskStatusControl({
  projectId,
  task,
  canChangeStatus,
  compact = false,
}: TaskStatusControlProps) {
  if (!canChangeStatus) {
    return <span className="text-sm font-semibold">{task.status}</span>;
  }

  return (
    <WorkItemActionForm action={changeTaskStatusAction}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="taskId" value={task.id} />
      <input type="hidden" name="version" value={task.version} />
      <div className={compact ? "flex gap-1" : "flex min-w-40 gap-2"}>
        <select
          name="status"
          defaultValue={task.status}
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
        >
          {taskStatusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <button className="rounded bg-[var(--color-primary)] px-2 py-1 text-xs font-bold text-[var(--simadep-foreground)]">
          OK
        </button>
      </div>
    </WorkItemActionForm>
  );
}
