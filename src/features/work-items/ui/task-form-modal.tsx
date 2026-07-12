"use client";

import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";

import type { WorkItemCategory, WorkItemTask } from "../application/contracts";
import {
  createSubtaskAction,
  createTaskAction,
  updateTaskAction,
} from "../server/work-item-actions";
import { WorkItemActionForm } from "./work-item-action-form";
import {
  dateInputValue,
  taskPriorityOptions,
} from "./work-item-ui-utils";

export type TaskFormMode =
  | { type: "createTask"; milestoneId: string }
  | { type: "createSubtask"; parentTaskId: string }
  | { type: "editTask"; task: WorkItemTask };

type TaskFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  categories: WorkItemCategory[];
  statuses: Array<{ value: string; label: string }>;
  mode: TaskFormMode | null;
};

export function TaskFormModal({
  isOpen,
  onClose,
  projectId,
  categories,
  statuses,
  mode,
}: TaskFormModalProps) {
  if (!mode) {
    return null;
  }

  const task = mode.type === "editTask" ? mode.task : undefined;
  const action =
    mode.type === "createTask"
      ? createTaskAction
      : mode.type === "createSubtask"
        ? createSubtaskAction
        : updateTaskAction;
  const title =
    mode.type === "createTask"
      ? "Buat Tugas"
      : mode.type === "createSubtask"
        ? "Buat Subtask"
        : "Edit Tugas";

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} size="2xl">
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          <WorkItemActionForm action={action} onSuccess={onClose} resetOnSuccess>
            <input type="hidden" name="projectId" value={projectId} />
            {mode.type === "createTask" ? (
              <input type="hidden" name="milestoneId" value={mode.milestoneId} />
            ) : null}
            {mode.type === "createSubtask" ? (
              <input type="hidden" name="parentTaskId" value={mode.parentTaskId} />
            ) : null}
            {task ? (
              <>
                <input type="hidden" name="taskId" value={task.id} />
                <input type="hidden" name="version" value={task.version} />
              </>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                name="name"
                label="Nama tugas"
                defaultValue={task?.name ?? ""}
                isRequired
              />
              <Select
                name="status"
                label="Status"
                defaultSelectedKeys={[task?.status ?? "pending"]}
              >
                {statuses.map((status) => (
                  <SelectItem key={status.value}>{status.label}</SelectItem>
                ))}
              </Select>
              <Select
                name="priority"
                label="Prioritas"
                defaultSelectedKeys={task?.priority ? [task.priority] : []}
              >
                {taskPriorityOptions.map((priority) => (
                  <SelectItem key={priority}>{priority}</SelectItem>
                ))}
              </Select>
              <Select
                name="categoryId"
                label="Kategori"
                defaultSelectedKeys={task?.categoryId ? [task.categoryId] : []}
              >
                {categories.map((category) => (
                  <SelectItem key={category.id}>{category.name}</SelectItem>
                ))}
              </Select>
              <Input
                name="startDate"
                label="Mulai"
                type="date"
                defaultValue={dateInputValue(task?.startDate ?? null)}
              />
              <Input
                name="dueDate"
                label="Tenggat"
                type="date"
                defaultValue={dateInputValue(task?.dueDate ?? null)}
              />
              <Input
                name="estimatedDurationMinutes"
                label="Estimasi menit"
                type="number"
                min={0}
                defaultValue={task?.estimatedDurationMinutes?.toString() ?? ""}
              />
              <Input
                name="displayOrder"
                label="Urutan"
                type="number"
                min={0}
                defaultValue={task?.displayOrder?.toString() ?? ""}
              />
              <Textarea
                name="description"
                label="Deskripsi"
                minRows={4}
                className="md:col-span-2"
                defaultValue={task?.description ?? ""}
              />
            </div>
            <ModalFooter className="px-0">
              <Button variant="light" onPress={onClose}>
                Batal
              </Button>
              <Button
                type="submit"
                color="primary"
                className="bg-[var(--color-primary)] font-bold text-[var(--simadep-foreground)]"
              >
                Simpan
              </Button>
            </ModalFooter>
          </WorkItemActionForm>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
