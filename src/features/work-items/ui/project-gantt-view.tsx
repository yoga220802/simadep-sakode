"use client";

import { Button } from "@heroui/react";
import { Edit, Trash2 } from "lucide-react";

import type { WorkItemTask } from "../application/contracts";
import type { FlatTask, TaskViewProps } from "./project-task-view-shared";
import {
  flattenTasks,
  isAssignedToActor,
  statusMeta,
  TaskAssigneeAvatars,
  TaskCategoryChip,
} from "./project-task-view-shared";
import { TaskStatusControl } from "./task-status-control";
import { formatTaskDate } from "./work-item-ui-utils";

type ScheduledTask = FlatTask & {
  range: {
    start: Date;
    end: Date;
  };
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function daysBetween(start: Date, end: Date) {
  return Math.max(0, Math.round((startOfDay(end) - startOfDay(start)) / 86400000));
}

function getTaskRange(task: WorkItemTask) {
  const start = task.startDate ?? task.dueDate;
  const end = task.dueDate ?? task.startDate;

  if (!start || !end) {
    return null;
  }

  return start <= end ? { start, end } : { start: end, end: start };
}

function scheduledRows(rows: FlatTask[]): ScheduledTask[] {
  return rows
    .map((row) => ({ ...row, range: getTaskRange(row.task) }))
    .filter((row): row is ScheduledTask => Boolean(row.range));
}

function GanttTaskControls({
  props,
  task,
}: {
  props: TaskViewProps;
  task: WorkItemTask;
}) {
  if (!props.workItems.canManage) {
    return null;
  }

  return (
    <div className="flex shrink-0 gap-1">
      <Button
        isIconOnly
        size="sm"
        variant="light"
        aria-label={`Edit tugas ${task.name}`}
        onPress={() => props.onEditTask(task)}
      >
        <Edit size={14} />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        color="danger"
        aria-label={`Hapus tugas ${task.name}`}
        onPress={() => props.onDeleteTask(task)}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
}

export function ProjectGanttView(props: TaskViewProps) {
  const flatTasks = flattenTasks(props.workItems);
  const rows = scheduledRows(flatTasks);
  const unscheduledRows = flatTasks.filter((row) => !getTaskRange(row.task));

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 py-10 text-center text-gray-500">
        Belum ada tugas dengan tanggal mulai atau tenggat untuk ditampilkan di Gantt.
      </div>
    );
  }

  const minDate = new Date(Math.min(...rows.map((row) => startOfDay(row.range.start))));
  const maxDate = new Date(Math.max(...rows.map((row) => startOfDay(row.range.end))));
  const totalDays = Math.max(1, daysBetween(minDate, maxDate) + 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
        <div>
          <p className="font-bold text-gray-800">Rentang jadwal</p>
          <p className="text-gray-500">
            {formatTaskDate(minDate)} sampai {formatTaskDate(maxDate)}
          </p>
        </div>
        <p className="text-xs font-semibold uppercase text-gray-400">
          {rows.length} terjadwal / {unscheduledRows.length} tanpa jadwal
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <div className="min-w-[980px] bg-white">
          <div className="grid grid-cols-[320px_1fr] border-b border-gray-200 bg-gray-50 text-xs font-bold uppercase text-gray-500">
            <div className="px-4 py-3">Tugas</div>
            <div className="grid grid-cols-3 px-4 py-3">
              <span>{formatTaskDate(minDate)}</span>
              <span className="text-center">Timeline</span>
              <span className="text-right">{formatTaskDate(maxDate)}</span>
            </div>
          </div>

          {rows.map((row) => {
            const { task, range, depth } = row;
            const left = (daysBetween(minDate, range.start) / totalDays) * 100;
            const width = Math.max(
              4,
              ((daysBetween(range.start, range.end) + 1) / totalDays) * 100,
            );
            const canChangeStatus =
              props.workItems.canManage || isAssignedToActor(task, props.actorId);

            return (
              <div
                key={task.id}
                className="grid grid-cols-[320px_1fr] border-b border-gray-100 last:border-b-0"
              >
                <div className="space-y-2 px-4 py-3" style={{ paddingLeft: 16 + depth * 18 }}>
                  <div className="flex items-start justify-between gap-2">
                    <button
                      className="min-w-0 text-left text-sm font-bold text-gray-900 hover:text-[var(--color-primary)]"
                      onClick={() => props.onOpenTask(task)}
                    >
                      <span className="line-clamp-2">{task.name}</span>
                    </button>
                    <GanttTaskControls props={props} task={task} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <TaskCategoryChip projectId={props.projectId} task={task} workItems={props.workItems} />
                    <TaskAssigneeAvatars projectId={props.projectId} task={task} workItems={props.workItems} />
                  </div>
                  <TaskStatusControl
                    projectId={props.projectId}
                    task={task}
                    statuses={props.workItems.statuses}
                    canChangeStatus={canChangeStatus}
                    compact
                  />
                </div>
                <div className="relative px-4 py-5">
                  <div className="absolute inset-x-4 top-1/2 h-px bg-gray-200" />
                  <button
                    className="absolute top-1/2 h-8 -translate-y-1/2 rounded bg-[var(--color-primary)] px-3 text-left text-xs font-bold text-[var(--simadep-foreground)] shadow-sm transition hover:brightness-95"
                    style={{
                      left: `calc(1rem + ${left}%)`,
                      width: `calc(${Math.min(width, 100 - left)}% - 1rem)`,
                    }}
                    onClick={() => props.onOpenTask(task)}
                  >
                    <span className="block truncate">{statusMeta[task.status]?.label ?? task.status}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {unscheduledRows.length ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-bold text-gray-800">Tanpa jadwal</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {unscheduledRows.map(({ task }) => (
              <Button key={task.id} size="sm" variant="flat" onPress={() => props.onOpenTask(task)}>
                {task.name}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
