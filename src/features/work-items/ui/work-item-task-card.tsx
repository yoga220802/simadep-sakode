import {
  assignTaskAction,
  changeTaskStatusAction,
  createSubtaskAction,
  deleteTaskAction,
  unassignTaskAction,
  updateTaskAction,
} from "../server/work-item-actions";
import type {
  ProjectWorkItems,
  WorkItemCategory,
  WorkItemTask,
} from "../application/contracts";
import type { TaskCollaboration } from "@/src/features/collaboration";
import { TaskCollaborationPanel } from "@/src/features/collaboration/ui/task-collaboration-panel";
import { WorkItemActionForm } from "./work-item-action-form";
import { taskPriorityOptions, taskStatusOptions } from "./work-item-ui-utils";

function dateInputValue(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function DurationLabel({ minutes }: { minutes: number | null }) {
  if (minutes == null) {
    return <span className="text-gray-400">-</span>;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return (
    <span>
      {hours ? `${hours}j ` : ""}{rest}m
    </span>
  );
}

function StatusOptions({ current }: { current?: string | null }) {
  return (
    <>
      {taskStatusOptions.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
      {current && !taskStatusOptions.includes(current as never) ? <option value={current}>{current}</option> : null}
    </>
  );
}

function PriorityOptions({ current }: { current?: string | null }) {
  return (
    <>
      <option value="">Tanpa prioritas</option>
      {taskPriorityOptions.map((priority) => (
        <option key={priority} value={priority}>
          {priority}
        </option>
      ))}
      {current && !taskPriorityOptions.includes(current as never) ? <option value={current}>{current}</option> : null}
    </>
  );
}

function CategoryOptions({
  categories,
  current,
}: {
  categories: WorkItemCategory[];
  current?: string | null;
}) {
  return (
    <>
      <option value="">Tanpa kategori</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
      {current && !categories.some((category) => category.id === current) ? <option value={current}>{current}</option> : null}
    </>
  );
}

export function TaskFormFields({
  task,
  categories,
}: {
  task?: WorkItemTask;
  categories: WorkItemCategory[];
}) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      <input
        name="name"
        defaultValue={task?.name}
        placeholder="Nama tugas"
        className="rounded border border-gray-200 px-3 py-2 text-sm"
        required
      />
      <select
        name="status"
        defaultValue={task?.status ?? "pending"}
        className="rounded border border-gray-200 px-3 py-2 text-sm"
      >
        <StatusOptions current={task?.status} />
      </select>
      <select
        name="priority"
        defaultValue={task?.priority ?? ""}
        className="rounded border border-gray-200 px-3 py-2 text-sm"
      >
        <PriorityOptions current={task?.priority} />
      </select>
      <select
        name="categoryId"
        defaultValue={task?.categoryId ?? ""}
        className="rounded border border-gray-200 px-3 py-2 text-sm"
      >
        <CategoryOptions categories={categories} current={task?.categoryId} />
      </select>
      <input
        type="date"
        name="startDate"
        defaultValue={dateInputValue(task?.startDate ?? null)}
        className="rounded border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        type="date"
        name="dueDate"
        defaultValue={dateInputValue(task?.dueDate ?? null)}
        className="rounded border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        type="number"
        min="0"
        name="estimatedDurationMinutes"
        defaultValue={task?.estimatedDurationMinutes ?? ""}
        placeholder="Estimasi menit"
        className="rounded border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        type="number"
        min="0"
        name="displayOrder"
        defaultValue={task?.displayOrder ?? ""}
        placeholder="Urutan"
        className="rounded border border-gray-200 px-3 py-2 text-sm"
      />
      <textarea
        name="description"
        defaultValue={task?.description ?? ""}
        placeholder="Deskripsi"
        className="min-h-20 rounded border border-gray-200 px-3 py-2 text-sm md:col-span-2"
      />
    </div>
  );
}

export function TaskCard({
  task,
  projectId,
  categories,
  projectMembers,
  canManage,
  collaborationByTaskId,
  depth = 0,
}: {
  task: WorkItemTask;
  projectId: string;
  categories: WorkItemCategory[];
  projectMembers: ProjectWorkItems["projectMembers"];
  canManage: boolean;
  collaborationByTaskId?: Record<string, TaskCollaboration>;
  depth?: number;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-semibold text-gray-900">{task.name}</p>
          <p className="text-xs text-gray-500">
            {task.status} · {task.categoryName ?? "Tanpa kategori"} · selesai:{" "}
            <DurationLabel minutes={task.finishedDurationMinutes} />
          </p>
        </div>
        <WorkItemActionForm action={changeTaskStatusAction} className="min-w-44">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="taskId" value={task.id} />
          <input type="hidden" name="version" value={task.version} />
          <select
            name="status"
            defaultValue={task.status}
            className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
          >
            <StatusOptions current={task.status} />
          </select>
          <button className="rounded bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-white">
            Ubah Status
          </button>
        </WorkItemActionForm>
      </div>

      {canManage ? (
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px]">
          <WorkItemActionForm action={updateTaskAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="version" value={task.version} />
            <input type="hidden" name="milestoneId" value={task.milestoneId} />
            <TaskFormFields task={task} categories={categories} />
            <button className="rounded bg-gray-900 px-3 py-2 text-sm font-semibold text-white">
              Simpan Tugas
            </button>
          </WorkItemActionForm>

          <div className="space-y-2">
            <WorkItemActionForm action={assignTaskAction}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="taskId" value={task.id} />
              <select
                name="userId"
                className="w-full rounded border border-gray-200 px-2 py-2 text-sm"
                required
              >
                <option value="">Pilih assignee</option>
                {projectMembers.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.name ?? member.email ?? member.userId}
                  </option>
                ))}
              </select>
              <button className="rounded bg-[var(--color-secondary)] px-3 py-2 text-sm font-semibold text-white">
                Assign
              </button>
            </WorkItemActionForm>
            <div className="space-y-1">
              {task.assignees.map((assignee) => (
                <WorkItemActionForm key={assignee.userId} action={unassignTaskAction}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="userId" value={assignee.userId} />
                  <button className="text-xs text-[var(--color-secondary)]">
                    Lepas {assignee.name ?? assignee.email}
                  </button>
                </WorkItemActionForm>
              ))}
            </div>
            <WorkItemActionForm action={deleteTaskAction}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="taskId" value={task.id} />
              <button className="rounded border border-[var(--color-secondary)]/30 px-3 py-2 text-sm font-semibold text-[var(--color-secondary)]">
                Hapus Tugas
              </button>
            </WorkItemActionForm>
          </div>
        </div>
      ) : null}

      {canManage && depth < 2 ? (
        <details className="rounded border border-dashed border-gray-200 p-3">
          <summary className="cursor-pointer text-sm font-semibold">Tambah Subtask</summary>
          <WorkItemActionForm action={createSubtaskAction} className="mt-3">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="parentTaskId" value={task.id} />
            <TaskFormFields categories={categories} />
            <button className="rounded bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white">
              Buat Subtask
            </button>
          </WorkItemActionForm>
        </details>
      ) : null}

      <TaskCollaborationPanel
        projectId={projectId}
        taskId={task.id}
        collaboration={collaborationByTaskId?.[task.id]}
      />

      {task.subtasks.length ? (
        <div className="ml-0 space-y-3 border-l border-gray-200 pl-3 md:ml-3">
          {task.subtasks.map((subtask) => (
            <TaskCard
              key={subtask.id}
              task={subtask}
              projectId={projectId}
              categories={categories}
              projectMembers={projectMembers}
              canManage={canManage}
              collaborationByTaskId={collaborationByTaskId}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
