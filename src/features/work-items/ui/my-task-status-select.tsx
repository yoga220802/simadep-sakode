"use client";

import { useRouter } from "next/navigation";

import type { MyTaskItem } from "../application/contracts";
import { changeTaskStatusAction } from "../server/work-item-actions";
import { WorkItemActionForm } from "./work-item-action-form";

type MyTaskStatusSelectProps = {
  task: Pick<MyTaskItem, "id" | "projectId" | "status" | "version">;
  statuses: string[];
};

export function MyTaskStatusSelect({ task, statuses }: MyTaskStatusSelectProps) {
  const router = useRouter();

  return (
    <WorkItemActionForm action={changeTaskStatusAction} onSuccess={() => router.refresh()}>
      <input type="hidden" name="projectId" value={task.projectId} />
      <input type="hidden" name="taskId" value={task.id} />
      <input type="hidden" name="version" value={task.version} />
      <select
        name="status"
        defaultValue={task.status}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-[var(--color-accent)] focus:outline-none"
      >
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
    </WorkItemActionForm>
  );
}
