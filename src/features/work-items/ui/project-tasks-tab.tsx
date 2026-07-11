"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  Avatar,
  AvatarGroup,
  Button,
  Switch,
  Tooltip,
} from "@heroui/react";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Columns3,
  Edit,
  ListTodo,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";

import type {
  ProjectWorkItems,
  WorkItemCategory,
  WorkItemMilestone,
  WorkItemTask,
} from "../application/contracts";
import {
  deleteMilestoneAction,
  deleteTaskAction,
} from "../server/work-item-actions";
import { AssignCategoryPopover } from "./assign-category-popover";
import { AssignTaskPopover } from "./assign-task-popover";
import { MilestoneFormModal } from "./milestone-form-modal";
import { ProjectGanttView } from "./project-gantt-view";
import { ProjectKanbanView } from "./project-kanban-view";
import type { ProjectTaskViewMode } from "./project-task-view-mode";
import { TaskDetailDrawer } from "./task-detail-drawer";
import { TaskFormModal, type TaskFormMode } from "./task-form-modal";
import { TaskStatusControl } from "./task-status-control";
import { WorkItemConfirmationModal } from "./work-item-confirmation-modal";
import {
  durationLabel,
  formatTaskDate,
  taskSortOptions,
} from "./work-item-ui-utils";

type ProjectTasksTabProps = {
  projectId: string;
  workItems: ProjectWorkItems;
  actorId: string;
  filters: {
    sortBy?: string;
    descending?: string;
    assignedToMe?: string;
    status?: string;
  };
  taskView: ProjectTaskViewMode;
};

function filterHref(projectId: string, updates: Record<string, string | undefined>) {
  const params = new URLSearchParams({ tab: "tasks" });
  for (const [key, value] of Object.entries(updates)) {
    if (value) {
      params.set(key, value);
    }
  }
  return `/projects/${projectId}?${params.toString()}`;
}

function TaskFilterControls({
  projectId,
  filters,
  taskView,
  statuses,
}: {
  projectId: string;
  filters: ProjectTasksTabProps["filters"];
  taskView: ProjectTaskViewMode;
  statuses: ProjectWorkItems["statuses"];
}) {
  const viewLinks: Array<{
    key: ProjectTaskViewMode;
    label: string;
    icon: ReactNode;
  }> = [
    { key: "list", label: "List", icon: <ListTodo size={15} /> },
    { key: "kanban", label: "Kanban", icon: <Columns3 size={15} /> },
    { key: "gantt", label: "Gantt", icon: <CalendarDays size={15} /> },
  ];

  return (
    <form action={`/projects/${projectId}`} className="space-y-3 border-b border-gray-200 p-4">
      <input type="hidden" name="tab" value="tasks" />
      <input type="hidden" name="taskView" value={taskView} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {viewLinks.map((view) => (
            <Button
              key={view.key}
              as={Link}
              href={filterHref(projectId, { ...filters, taskView: view.key })}
              size="sm"
              variant={taskView === view.key ? "solid" : "bordered"}
              className={
                taskView === view.key
                  ? "bg-[var(--color-primary)] font-bold text-[var(--simadep-foreground)]"
                  : "font-semibold"
              }
              startContent={view.icon}
            >
              {view.label}
            </Button>
          ))}
        </div>
        <Button
          as={Link}
          href={filterHref(projectId, { taskView })}
          size="sm"
          variant="light"
        >
          Reset Filter
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <Switch
            name="assignedToMe"
            value="true"
            defaultSelected={filters.assignedToMe === "true"}
            size="sm"
          />
          Tugas Saya
        </label>
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">Semua status</option>
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <select
          name="sortBy"
          defaultValue={filters.sortBy ?? "display_order"}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          {taskSortOptions.map((field) => (
            <option key={field} value={field}>
              {field}
            </option>
          ))}
        </select>
        <select
          name="descending"
          defaultValue={filters.descending ?? "false"}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="false">Ascending</option>
          <option value="true">Descending</option>
        </select>
        <Button type="submit" size="sm" variant="bordered">
          Terapkan
        </Button>
      </div>
    </form>
  );
}

function TaskRow({
  projectId,
  task,
  categories,
  statuses,
  projectMembers,
  actorId,
  canManage,
  depth = 0,
  onOpenTask,
  onEditTask,
  onCreateSubtask,
  onDeleteTask,
}: {
  projectId: string;
  task: WorkItemTask;
  categories: WorkItemCategory[];
  statuses: ProjectWorkItems["statuses"];
  projectMembers: ProjectWorkItems["projectMembers"];
  actorId: string;
  canManage: boolean;
  depth?: number;
  onOpenTask: (task: WorkItemTask) => void;
  onEditTask: (task: WorkItemTask) => void;
  onCreateSubtask: (task: WorkItemTask) => void;
  onDeleteTask: (task: WorkItemTask) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasSubtasks = task.subtasks.length > 0;
  const assignedToActor = task.assignees.some((assignee) => assignee.userId === actorId);
  const canChangeStatus = canManage || assignedToActor;

  return (
    <>
      <tr className="group hover:bg-gray-50">
        <td className="whitespace-nowrap px-4 py-3" style={{ paddingLeft: 16 + depth * 24 }}>
          <div className="flex items-center gap-2">
            {hasSubtasks ? (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                aria-label={isExpanded ? "Sembunyikan subtask" : "Tampilkan subtask"}
                onPress={() => setIsExpanded((value) => !value)}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </Button>
            ) : (
              <span className="w-8" />
            )}
            <button
              className="font-semibold text-gray-900 hover:text-[var(--color-primary)] hover:underline"
              onClick={() => onOpenTask(task)}
            >
              {task.name}
            </button>
            {canManage && depth < 2 ? (
              <Tooltip content="Tambah Subtask">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  aria-label={`Tambah subtask untuk ${task.name}`}
                  className="opacity-0 transition group-hover:opacity-100"
                  onPress={() => onCreateSubtask(task)}
                >
                  <Plus size={15} />
                </Button>
              </Tooltip>
            ) : null}
          </div>
        </td>
        <td className="px-4 py-3">
          <TaskStatusControl
            projectId={projectId}
            task={task}
            statuses={statuses}
            canChangeStatus={canChangeStatus}
          />
        </td>
        <td className="px-4 py-3">
          <AssignCategoryPopover
            projectId={projectId}
            task={task}
            categories={categories}
            canEdit={canManage}
          >
            <Button
              size="sm"
              variant="light"
              startContent={<Tag size={14} />}
              className="text-gray-600"
            >
              {task.categoryName ?? "Pilih Kategori"}
            </Button>
          </AssignCategoryPopover>
        </td>
        <td className="px-4 py-3">
          <AssignTaskPopover
            projectId={projectId}
            task={task}
            projectMembers={projectMembers}
            canAssign={canManage}
          >
            <div className="flex cursor-pointer items-center gap-2">
              <AvatarGroup size="sm" max={3}>
                {task.assignees.map((assignee) => (
                  <Avatar
                    key={assignee.userId}
                    name={(assignee.name ?? assignee.email ?? "?").slice(0, 2)}
                  />
                ))}
              </AvatarGroup>
              {canManage ? <Plus size={15} className="text-gray-400" /> : null}
            </div>
          </AssignTaskPopover>
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
          {formatTaskDate(task.dueDate)}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
          {task.priority ?? "-"}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
          {durationLabel(task.finishedDurationMinutes)}
        </td>
        <td className="px-4 py-3">
          {canManage ? (
            <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                aria-label={`Edit tugas ${task.name}`}
                onPress={() => onEditTask(task)}
              >
                <Edit size={15} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                aria-label={`Hapus tugas ${task.name}`}
                onPress={() => onDeleteTask(task)}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          ) : null}
        </td>
      </tr>
      {isExpanded
        ? task.subtasks.map((subtask) => (
            <TaskRow
              key={subtask.id}
              projectId={projectId}
              task={subtask}
              categories={categories}
              statuses={statuses}
              projectMembers={projectMembers}
              actorId={actorId}
              canManage={canManage}
              depth={depth + 1}
              onOpenTask={onOpenTask}
              onEditTask={onEditTask}
              onCreateSubtask={onCreateSubtask}
              onDeleteTask={onDeleteTask}
            />
          ))
        : null}
    </>
  );
}

function MilestoneGroup({
  projectId,
  milestone,
  workItems,
  actorId,
  onCreateTask,
  onEditMilestone,
  onDeleteMilestone,
  onOpenTask,
  onEditTask,
  onCreateSubtask,
  onDeleteTask,
}: {
  projectId: string;
  milestone: WorkItemMilestone;
  workItems: ProjectWorkItems;
  actorId: string;
  onCreateTask: (milestone: WorkItemMilestone) => void;
  onEditMilestone: (milestone: WorkItemMilestone) => void;
  onDeleteMilestone: (milestone: WorkItemMilestone) => void;
  onOpenTask: (task: WorkItemTask) => void;
  onEditTask: (task: WorkItemTask) => void;
  onCreateSubtask: (task: WorkItemTask) => void;
  onDeleteTask: (task: WorkItemTask) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <section className="space-y-2">
      <div className="group flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            isIconOnly
            variant="light"
            size="sm"
            aria-label={isOpen ? "Tutup milestone" : "Buka milestone"}
            onPress={() => setIsOpen((value) => !value)}
          >
            {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </Button>
          <h3 className="truncate text-xl font-bold text-gray-800">{milestone.title}</h3>
          {workItems.canManage ? (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              aria-label={`Edit milestone ${milestone.title}`}
              className="opacity-0 transition group-hover:opacity-100"
              onPress={() => onEditMilestone(milestone)}
            >
              <Edit size={15} />
            </Button>
          ) : null}
        </div>
        {workItems.canManage ? (
          <div className="flex gap-1">
            <Button
              isIconOnly
              variant="light"
              size="sm"
              aria-label={`Buat tugas di milestone ${milestone.title}`}
              onPress={() => onCreateTask(milestone)}
            >
              <Plus size={17} />
            </Button>
            <Button
              isIconOnly
              variant="light"
              size="sm"
              color="danger"
              aria-label={`Hapus milestone ${milestone.title}`}
              onPress={() => onDeleteMilestone(milestone)}
            >
              <Trash2 size={15} />
            </Button>
          </div>
        ) : null}
      </div>
      {isOpen ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Penerima</th>
                <th className="px-4 py-3">Tenggat</th>
                <th className="px-4 py-3">Prioritas</th>
                <th className="px-4 py-3">Durasi</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {milestone.tasks.length ? (
                milestone.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    projectId={projectId}
                    task={task}
                    categories={workItems.categories}
                    statuses={workItems.statuses}
                    projectMembers={workItems.projectMembers}
                    actorId={actorId}
                    canManage={workItems.canManage}
                    onOpenTask={onOpenTask}
                    onEditTask={onEditTask}
                    onCreateSubtask={onCreateSubtask}
                    onDeleteTask={onDeleteTask}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Belum ada tugas di milestone ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

export function ProjectTasksTab({
  projectId,
  workItems,
  actorId,
  filters,
  taskView,
}: ProjectTasksTabProps) {
  const [taskFormMode, setTaskFormMode] = useState<TaskFormMode | null>(null);
  const [milestoneToEdit, setMilestoneToEdit] = useState<WorkItemMilestone | null>(
    null,
  );
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<WorkItemTask | null>(null);
  const [milestoneToDelete, setMilestoneToDelete] =
    useState<WorkItemMilestone | null>(null);
  const [selectedTask, setSelectedTask] = useState<WorkItemTask | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  function openTask(task: WorkItemTask) {
    setEditingTaskId(null);
    setSelectedTask(task);
  }

  function editTask(task: WorkItemTask) {
    setEditingTaskId(task.id);
    setSelectedTask(task);
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <TaskFilterControls
        projectId={projectId}
        filters={filters}
        taskView={taskView}
        statuses={workItems.statuses}
      />
      <div className="space-y-8 p-6">
        {workItems.canManage ? (
          <Button
            variant="light"
            className="font-semibold text-[var(--color-primary)]"
            startContent={<Plus size={16} />}
            onPress={() => {
              setMilestoneToEdit(null);
              setIsMilestoneModalOpen(true);
            }}
          >
            Buat Milestone
          </Button>
        ) : null}
        {taskView === "kanban" ? (
          <ProjectKanbanView
            projectId={projectId}
            workItems={workItems}
            actorId={actorId}
            onOpenTask={openTask}
            onEditTask={editTask}
            onCreateSubtask={(task) =>
              setTaskFormMode({ type: "createSubtask", parentTaskId: task.id })
            }
            onDeleteTask={setTaskToDelete}
          />
        ) : null}
        {taskView === "gantt" ? (
          <ProjectGanttView
            projectId={projectId}
            workItems={workItems}
            actorId={actorId}
            onOpenTask={openTask}
            onEditTask={editTask}
            onCreateSubtask={(task) =>
              setTaskFormMode({ type: "createSubtask", parentTaskId: task.id })
            }
            onDeleteTask={setTaskToDelete}
          />
        ) : null}
        {taskView === "list" && workItems.milestones.length ? (
          workItems.milestones.map((milestone) => (
            <MilestoneGroup
              key={milestone.id}
              projectId={projectId}
              milestone={milestone}
              workItems={workItems}
              actorId={actorId}
              onCreateTask={(item) =>
                setTaskFormMode({ type: "createTask", milestoneId: item.id })
              }
              onEditMilestone={(item) => {
                setMilestoneToEdit(item);
                setIsMilestoneModalOpen(true);
              }}
              onDeleteMilestone={setMilestoneToDelete}
              onOpenTask={openTask}
              onEditTask={editTask}
              onCreateSubtask={(task) =>
                setTaskFormMode({ type: "createSubtask", parentTaskId: task.id })
              }
              onDeleteTask={setTaskToDelete}
            />
          ))
        ) : taskView === "list" ? (
          <div className="rounded-lg border border-dashed border-gray-200 py-10 text-center text-gray-500">
            Tidak ada milestone.
          </div>
        ) : null}
      </div>

      <TaskFormModal
        isOpen={Boolean(taskFormMode)}
        onClose={() => setTaskFormMode(null)}
        projectId={projectId}
        categories={workItems.categories}
        statuses={workItems.statuses}
        mode={taskFormMode}
      />
      <MilestoneFormModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        projectId={projectId}
        milestone={milestoneToEdit}
      />
      <TaskDetailDrawer
        isOpen={Boolean(selectedTask)}
        onClose={() => {
          setSelectedTask(null);
          setEditingTaskId(null);
        }}
        projectId={projectId}
        task={selectedTask}
        categories={workItems.categories}
        statuses={workItems.statuses}
        projectMembers={workItems.projectMembers}
        actorId={actorId}
        canManage={workItems.canManage}
        startEditing={selectedTask ? editingTaskId === selectedTask.id : false}
      />
      <WorkItemConfirmationModal
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        title="Hapus tugas?"
        message={`Tugas "${taskToDelete?.name ?? ""}" akan dihapus.`}
        action={deleteTaskAction}
        fields={{ projectId, taskId: taskToDelete?.id ?? "" }}
      />
      <WorkItemConfirmationModal
        isOpen={Boolean(milestoneToDelete)}
        onClose={() => setMilestoneToDelete(null)}
        title="Hapus milestone?"
        message={`Milestone "${milestoneToDelete?.title ?? ""}" akan dihapus jika tidak memiliki tugas.`}
        action={deleteMilestoneAction}
        fields={{ projectId, milestoneId: milestoneToDelete?.id ?? "" }}
      />
    </div>
  );
}
