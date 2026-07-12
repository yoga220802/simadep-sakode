"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Chip,
  Input,
  Tooltip,
} from "@heroui/react";
import {
  CalendarDays,
  Edit,
  Plus,
  Trash2,
} from "lucide-react";

import type { FlatTask, TaskViewProps } from "./project-task-view-shared";
import {
  flattenTasks,
  isAssignedToActor,
  statusMeta,
  TaskAssigneeAvatars,
  TaskCategoryChip,
} from "./project-task-view-shared";
import { TaskStatusControl } from "./task-status-control";
import { createTaskStatusAction, changeTaskStatusAction } from "../server/work-item-actions";
import { workItemActionInitialState } from "../server/action-state";
import { WorkItemActionForm } from "./work-item-action-form";
import { useActionToast } from "@/src/shared/ui/use-action-toast";
import {
  durationLabel,
  formatTaskDate,
} from "./work-item-ui-utils";

function TaskCard({
  projectId,
  row,
  workItems,
  actorId,
  onOpenTask,
  onEditTask,
  onCreateSubtask,
  onDeleteTask,
}: TaskViewProps & { row: FlatTask }) {
  const { task, milestoneTitle, depth } = row;
  const canChangeStatus = workItems.canManage || isAssignedToActor(task, actorId);

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <button className="min-w-0 text-left" onClick={() => onOpenTask(task)}>
          <p className="line-clamp-2 text-sm font-bold text-gray-900 hover:text-[var(--color-primary)]">
            {depth > 0 ? `${"Sub ".repeat(Math.min(depth, 2))}${task.name}` : task.name}
          </p>
          <p className="mt-1 truncate text-xs text-gray-400">{milestoneTitle}</p>
        </button>
        {workItems.canManage ? (
          <div className="flex shrink-0 gap-1">
            <Tooltip content="Edit tugas">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                aria-label={`Edit tugas ${task.name}`}
                onPress={() => onEditTask(task)}
              >
                <Edit size={14} />
              </Button>
            </Tooltip>
            <Tooltip content="Hapus tugas">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                aria-label={`Hapus tugas ${task.name}`}
                onPress={() => onDeleteTask(task)}
              >
                <Trash2 size={14} />
              </Button>
            </Tooltip>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <TaskCategoryChip projectId={projectId} task={task} workItems={workItems} />
        {task.priority ? (
          <Chip size="sm" variant="flat" color="warning">
            {task.priority}
          </Chip>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2 text-xs text-gray-500">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1">
            <CalendarDays size={13} />
            {formatTaskDate(task.dueDate)}
          </span>
          <span>{durationLabel(task.finishedDurationMinutes)}</span>
        </div>
        <TaskAssigneeAvatars projectId={projectId} task={task} workItems={workItems} />
        <TaskStatusControl
          projectId={projectId}
          task={task}
          statuses={workItems.statuses}
          canChangeStatus={canChangeStatus}
          compact
        />
      </div>

      {workItems.canManage && depth < 2 ? (
        <Button
          size="sm"
          variant="light"
          className="mt-3 h-7 px-2 text-xs font-semibold text-[var(--color-primary)]"
          startContent={<Plus size={13} />}
          onPress={() => onCreateSubtask(task)}
        >
          Subtask
        </Button>
      ) : null}
    </article>
  );
}

export function ProjectKanbanView(props: TaskViewProps) {
  const flatTasks = flattenTasks(props.workItems);
  const router = useRouter();
  const [dropState, dropAction] = useActionState(
    changeTaskStatusAction,
    workItemActionInitialState,
  );
  const handledDropStateRef = useRef(dropState);
  const [isDropping, startTransition] = useTransition();
  useActionToast(dropState, {
    isPending: isDropping,
    loadingMessage: "Memindahkan status tugas...",
  });

  useEffect(() => {
    if (!dropState.ok || !dropState.message || handledDropStateRef.current === dropState) {
      return;
    }
    handledDropStateRef.current = dropState;
    router.refresh();
  }, [dropState, router]);

  function handleDrop(event: React.DragEvent<HTMLElement>, status: string) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("application/x-simadep-task-id");
    const version = event.dataTransfer.getData("application/x-simadep-task-version");
    const currentStatus = event.dataTransfer.getData(
      "application/x-simadep-task-status",
    );

    if (!taskId || !version || currentStatus === status) {
      return;
    }

    const formData = new FormData();
    formData.set("projectId", props.projectId);
    formData.set("taskId", taskId);
    formData.set("version", version);
    formData.set("status", status);
    startTransition(() => dropAction(formData));
  }

  return (
    <div className="space-y-4">
      {props.workItems.canManage ? (
        <WorkItemActionForm
          action={createTaskStatusAction}
          className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3"
          onSuccess={() => router.refresh()}
          resetOnSuccess
        >
          <input type="hidden" name="projectId" value={props.projectId} />
          <div className="flex flex-wrap items-end gap-2">
            <Input
              name="label"
              label="Status baru"
              size="sm"
              className="max-w-xs"
              placeholder="Contoh: Review"
            />
            <Button
              type="submit"
              size="sm"
              variant="bordered"
              className="font-semibold"
            >
              Tambah Status
            </Button>
          </div>
        </WorkItemActionForm>
      ) : null}
      {dropState.message && !dropState.ok ? (
        <p className="text-sm text-[var(--color-secondary)]">{dropState.message}</p>
      ) : null}
      <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-4">
        {props.workItems.statuses.map((status) => {
          const rows = flatTasks.filter((row) => row.task.status === status.value);
          return (
            <section
              key={status.value}
              className="flex min-h-[360px] w-72 shrink-0 flex-col rounded-lg border border-gray-200 bg-gray-50"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, status.value)}
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Chip size="sm" color={statusMeta[status.value]?.chip ?? "default"} variant="flat">
                    {status.label}
                  </Chip>
                  <span className="text-xs font-semibold text-gray-500">
                    {rows.length}
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-3 p-3">
                {rows.length ? (
                  rows.map((row) => (
                    <div
                      key={row.task.id}
                      draggable={
                        props.workItems.canManage ||
                        isAssignedToActor(row.task, props.actorId)
                      }
                      onDragStart={(event) => {
                        event.dataTransfer.setData(
                          "application/x-simadep-task-id",
                          row.task.id,
                        );
                        event.dataTransfer.setData(
                          "application/x-simadep-task-version",
                          String(row.task.version),
                        );
                        event.dataTransfer.setData(
                          "application/x-simadep-task-status",
                          row.task.status,
                        );
                        event.dataTransfer.effectAllowed = "move";
                      }}
                    >
                      <TaskCard {...props} row={row} />
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-white p-4 text-center text-sm text-gray-400">
                    Tarik tugas ke sini.
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
      </div>
    </div>
  );
}
