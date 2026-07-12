"use client";

import {
  Avatar,
  Chip,
  Listbox,
  ListboxItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@heroui/react";

import type { ProjectWorkItems, WorkItemTask } from "../application/contracts";
import {
  assignTaskAction,
  unassignTaskAction,
} from "../server/work-item-actions";
import { WorkItemActionForm } from "./work-item-action-form";

type AssignTaskPopoverProps = {
  projectId: string;
  task: WorkItemTask;
  projectMembers: ProjectWorkItems["projectMembers"];
  canAssign: boolean;
  children: React.ReactNode;
};

export function AssignTaskPopover({
  projectId,
  task,
  projectMembers,
  canAssign,
  children,
}: AssignTaskPopoverProps) {
  if (!canAssign) {
    return <>{children}</>;
  }

  const assigneeIds = new Set(task.assignees.map((assignee) => assignee.userId));

  return (
    <Popover placement="bottom-start">
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent className="p-2">
        <div className="w-80">
          <h4 className="px-2 py-1.5 text-sm font-bold">Tugaskan kepada</h4>
          <Listbox aria-label="Tugaskan kepada member" variant="flat">
            {projectMembers.map((member) => {
              const assigned = assigneeIds.has(member.userId);
              return (
                <ListboxItem key={member.userId} textValue={member.name ?? member.email ?? member.userId}>
                  <WorkItemActionForm
                    action={assigned ? unassignTaskAction : assignTaskAction}
                    className="w-full"
                  >
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="taskId" value={task.id} />
                    <input type="hidden" name="userId" value={member.userId} />
                    <button type="submit" className="flex w-full items-center justify-between gap-3 text-left">
                      <span className="flex items-center gap-2">
                        <Avatar
                          size="sm"
                          name={(member.name ?? member.email ?? "?").slice(0, 2)}
                        />
                        <span className="flex flex-col">
                          <span className="text-sm">{member.name ?? member.email}</span>
                          <span className="text-xs text-gray-400">{member.role}</span>
                        </span>
                      </span>
                      {assigned ? (
                        <Chip color="primary" size="sm" variant="flat">
                          Ditugaskan
                        </Chip>
                      ) : null}
                    </button>
                  </WorkItemActionForm>
                </ListboxItem>
              );
            })}
          </Listbox>
        </div>
      </PopoverContent>
    </Popover>
  );
}
