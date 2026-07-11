"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerHeader,
  Input,
  Spinner,
  Textarea,
} from "@heroui/react";
import {
  Link as LinkIcon,
  MessageSquare,
  Paperclip,
  Plus,
  X,
} from "lucide-react";

import type { TaskCollaboration } from "@/src/features/collaboration";
import {
  createCommentAction,
  createFileAttachmentAction,
  createLinkAttachmentAction,
  deleteAttachmentAction,
  deleteCommentAction,
} from "@/src/features/collaboration/server/collaboration-actions";
import { CollaborationActionForm } from "@/src/features/collaboration/ui/collaboration-action-form";
import type { ProjectWorkItems, WorkItemCategory, WorkItemTask } from "../application/contracts";
import { changeTaskStatusAction } from "../server/work-item-actions";
import { AssignTaskPopover } from "./assign-task-popover";
import { WorkItemActionForm } from "./work-item-action-form";
import {
  durationLabel,
  formatTaskDate,
  taskStatusOptions,
} from "./work-item-ui-utils";

type TaskDetailDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  task: WorkItemTask | null;
  categories: WorkItemCategory[];
  projectMembers: ProjectWorkItems["projectMembers"];
  actorId: string;
  canManage: boolean;
};

function canDeleteComment(input: {
  actorId: string;
  canManage: boolean;
  authorId: string;
}) {
  return input.canManage || input.actorId === input.authorId;
}

function canDeleteAttachment(input: {
  actorId: string;
  canManage: boolean;
  uploadedBy: string | null;
}) {
  return input.canManage || input.actorId === input.uploadedBy;
}

export function TaskDetailDrawer({
  isOpen,
  onClose,
  projectId,
  task,
  projectMembers,
  actorId,
  canManage,
}: TaskDetailDrawerProps) {
  const [collaboration, setCollaboration] = useState<TaskCollaboration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !task) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setCollaboration(null);
    fetch(`/api/tasks/${task.id}/collaboration`, { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as TaskCollaboration | { error: string };
        if (!response.ok) {
          throw new Error("error" in data ? data.error : "Gagal memuat diskusi.");
        }
        if (!("taskId" in data)) {
          throw new Error("Gagal memuat diskusi.");
        }
        if (!cancelled) {
          setCollaboration(data);
        }
      })
      .catch((fetchError: unknown) => {
        if (!cancelled) {
          setError(
            fetchError instanceof Error ? fetchError.message : "Gagal memuat diskusi.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, task]);

  const assignedToActor = useMemo(
    () => task?.assignees.some((assignee) => assignee.userId === actorId) ?? false,
    [actorId, task],
  );

  if (!task) {
    return null;
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="lg">
      <DrawerContent className="bg-white p-0">
        <div className="flex h-full flex-col">
          <DrawerHeader className="border-b p-6">
            <div className="flex w-full items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--color-text-main)]">
                  {task.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {task.status} · {task.priority ?? "tanpa prioritas"} · selesai:{" "}
                  {durationLabel(task.finishedDurationMinutes)}
                </p>
              </div>
              <Button
                isIconOnly
                variant="bordered"
                size="sm"
                aria-label="Tutup detail tugas"
                onPress={onClose}
              >
                <X size={18} />
              </Button>
            </div>
          </DrawerHeader>

          <div className="flex-1 space-y-7 overflow-y-auto p-6">
            <section className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-gray-400">Assignee</p>
                <AssignTaskPopover
                  projectId={projectId}
                  task={task}
                  projectMembers={projectMembers}
                  canAssign={canManage}
                >
                  <button
                    aria-label={`Kelola assignee ${task.name}`}
                    className="mt-1 text-left font-semibold text-gray-700 hover:text-[var(--color-primary)]"
                  >
                    {task.assignees.length
                      ? task.assignees
                          .map((assignee) => assignee.name ?? assignee.email)
                          .join(", ")
                      : "Belum ditugaskan"}
                  </button>
                </AssignTaskPopover>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400">Tenggat</p>
                <p className="mt-1 font-semibold">{formatTaskDate(task.dueDate)}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400">Status</p>
                {canManage || assignedToActor ? (
                  <WorkItemActionForm action={changeTaskStatusAction}>
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="taskId" value={task.id} />
                    <input type="hidden" name="version" value={task.version} />
                    <div className="mt-1 flex gap-2">
                      <select
                        aria-label={`Status ${task.name}`}
                        name="status"
                        defaultValue={task.status}
                        className="rounded-lg border border-gray-200 px-2 py-1"
                      >
                        {taskStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" size="sm" variant="bordered">
                        Ubah
                      </Button>
                    </div>
                  </WorkItemActionForm>
                ) : (
                  <p className="mt-1 font-semibold">{task.status}</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400">Subtask</p>
                <p className="mt-1 font-semibold">{task.subtasks.length} item</p>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-lg font-bold">Deskripsi</h3>
              <p className="whitespace-pre-wrap text-sm text-gray-600">
                {task.description || "Tidak ada deskripsi."}
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Paperclip size={18} />
                <h3 className="text-lg font-bold">Lampiran</h3>
              </div>
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Spinner size="sm" /> Memuat lampiran...
                </div>
              ) : null}
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {collaboration?.taskAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 p-2 text-sm"
                >
                  <a
                    href={attachment.externalUrl ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold hover:text-[var(--color-primary)]"
                  >
                    {attachment.fileName}
                  </a>
                  {canDeleteAttachment({
                    actorId,
                    canManage,
                    uploadedBy: attachment.uploadedBy,
                  }) ? (
                    <CollaborationActionForm action={deleteAttachmentAction}>
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="attachmentId" value={attachment.id} />
                      <button className="text-xs text-red-600">Hapus</button>
                    </CollaborationActionForm>
                  ) : null}
                </div>
              ))}
              <div className="grid gap-2 sm:grid-cols-2">
                <CollaborationActionForm
                  action={createFileAttachmentAction}
                  encType="multipart/form-data"
                >
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="taskId" value={task.id} />
                  <Input type="file" name="file" size="sm" />
                  <Button type="submit" size="sm" variant="bordered" startContent={<Plus size={14} />}>
                    Upload File
                  </Button>
                </CollaborationActionForm>
                <CollaborationActionForm action={createLinkAttachmentAction}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="taskId" value={task.id} />
                  <Input name="link" size="sm" placeholder="https://..." startContent={<LinkIcon size={14} />} />
                  <Input name="linkName" size="sm" placeholder="Nama link" />
                  <Button type="submit" size="sm" variant="bordered">
                    Tambah Link
                  </Button>
                </CollaborationActionForm>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} />
                <h3 className="text-lg font-bold">Komentar</h3>
              </div>
              <CollaborationActionForm action={createCommentAction}>
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="taskId" value={task.id} />
                <Textarea name="content" minRows={3} placeholder="Tulis komentar..." />
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[var(--color-primary)] font-bold text-[var(--simadep-foreground)]"
                >
                  Kirim Komentar
                </Button>
              </CollaborationActionForm>
              <div className="space-y-3">
                {collaboration?.comments.map((comment) => (
                  <article
                    key={comment.id}
                    className="rounded-lg border border-gray-100 bg-white p-3"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">
                          {comment.authorName ?? comment.userId}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(comment.createdAt).toLocaleString("id-ID")}
                        </p>
                      </div>
                      {canDeleteComment({
                        actorId,
                        canManage,
                        authorId: comment.userId,
                      }) ? (
                        <CollaborationActionForm action={deleteCommentAction}>
                          <input type="hidden" name="projectId" value={projectId} />
                          <input type="hidden" name="taskId" value={task.id} />
                          <input type="hidden" name="commentId" value={comment.id} />
                          <button className="text-xs text-red-600">Hapus</button>
                        </CollaborationActionForm>
                      ) : null}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                      {comment.content}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
