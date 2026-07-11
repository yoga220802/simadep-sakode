"use client";

import {
  Button,
  Chip,
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
import {
  durationLabel,
  formatTaskDate,
  taskStatusOptions,
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

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[980px] grid-cols-4 gap-4">
        {taskStatusOptions.map((status) => {
          const rows = flatTasks.filter((row) => row.task.status === status);
          return (
            <section
              key={status}
              className="flex min-h-[360px] flex-col rounded-lg border border-gray-200 bg-gray-50"
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Chip size="sm" color={statusMeta[status]?.chip} variant="flat">
                    {statusMeta[status]?.label ?? status}
                  </Chip>
                  <span className="text-xs font-semibold text-gray-500">
                    {rows.length}
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-3 p-3">
                {rows.length ? (
                  rows.map((row) => <TaskCard key={row.task.id} {...props} row={row} />)
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-white p-4 text-center text-sm text-gray-400">
                    Tidak ada tugas.
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
