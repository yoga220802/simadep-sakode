"use client";

import {
  Avatar,
  AvatarGroup,
  Button,
  type ChipProps,
} from "@heroui/react";
import { Plus, Tag } from "lucide-react";

import type {
  ProjectWorkItems,
  WorkItemTask,
} from "../application/contracts";
import { AssignCategoryPopover } from "./assign-category-popover";
import { AssignTaskPopover } from "./assign-task-popover";

export type TaskViewProps = {
  projectId: string;
  workItems: ProjectWorkItems;
  actorId: string;
  onOpenTask: (task: WorkItemTask) => void;
  onEditTask: (task: WorkItemTask) => void;
  onCreateSubtask: (task: WorkItemTask) => void;
  onDeleteTask: (task: WorkItemTask) => void;
};

export type FlatTask = {
  task: WorkItemTask;
  milestoneTitle: string;
  depth: number;
};

export const statusMeta: Record<
  string,
  { label: string; chip: ChipProps["color"] }
> = {
  pending: { label: "Belum Mulai", chip: "default" },
  in_progress: { label: "Berjalan", chip: "primary" },
  completed: { label: "Selesai", chip: "success" },
  cancelled: { label: "Dibatalkan", chip: "danger" },
};

export function flattenTasks(workItems: ProjectWorkItems) {
  const rows: FlatTask[] = [];

  for (const milestone of workItems.milestones) {
    const visit = (task: WorkItemTask, depth: number) => {
      rows.push({ task, milestoneTitle: milestone.title, depth });
      for (const subtask of task.subtasks) {
        visit(subtask, depth + 1);
      }
    };

    for (const task of milestone.tasks) {
      visit(task, 0);
    }
  }

  return rows;
}

export function isAssignedToActor(task: WorkItemTask, actorId: string) {
  return task.assignees.some((assignee) => assignee.userId === actorId);
}

export function TaskAssigneeAvatars({
  projectId,
  task,
  workItems,
}: {
  projectId: string;
  task: WorkItemTask;
  workItems: ProjectWorkItems;
}) {
  return (
    <AssignTaskPopover
      projectId={projectId}
      task={task}
      projectMembers={workItems.projectMembers}
      canAssign={workItems.canManage}
    >
      <div className="flex min-h-8 cursor-pointer items-center gap-2">
        <AvatarGroup size="sm" max={3}>
          {task.assignees.map((assignee) => (
            <Avatar
              key={assignee.userId}
              name={(assignee.name ?? assignee.email ?? "?").slice(0, 2)}
            />
          ))}
        </AvatarGroup>
        {workItems.canManage ? <Plus size={14} className="text-gray-400" /> : null}
      </div>
    </AssignTaskPopover>
  );
}

export function TaskCategoryChip({
  projectId,
  task,
  workItems,
}: {
  projectId: string;
  task: WorkItemTask;
  workItems: ProjectWorkItems;
}) {
  return (
    <AssignCategoryPopover
      projectId={projectId}
      task={task}
      categories={workItems.categories}
      canEdit={workItems.canManage}
    >
      <Button
        size="sm"
        variant="flat"
        startContent={<Tag size={13} />}
        className="h-7 max-w-full justify-start truncate bg-gray-100 text-xs text-gray-600"
      >
        <span className="truncate">{task.categoryName ?? "Tanpa kategori"}</span>
      </Button>
    </AssignCategoryPopover>
  );
}
