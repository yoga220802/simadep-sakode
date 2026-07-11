"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useRouter,
} from "next/navigation";
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
  Edit,
  Link as LinkIcon,
  MessageSquare,
  Paperclip,
  Plus,
} from "lucide-react";
import Pusher from "pusher-js";

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
import { changeTaskStatusAction, updateTaskAction } from "../server/work-item-actions";
import { AssignTaskPopover } from "./assign-task-popover";
import { WorkItemActionForm } from "./work-item-action-form";
import {
  durationLabel,
  dateInputValue,
  formatTaskDate,
  taskPriorityOptions,
} from "./work-item-ui-utils";

type TaskDetailDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  task: WorkItemTask | null;
  categories: WorkItemCategory[];
  statuses: Array<{ value: string; label: string }>;
  projectMembers: ProjectWorkItems["projectMembers"];
  actorId: string;
  canManage: boolean;
  startEditing?: boolean;
};

type InvalidationPayload = {
  type?: string;
  projectId?: string;
  taskId?: string;
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

function parseInvalidationPayload(data: unknown): InvalidationPayload | null {
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data) as unknown;
      return parseInvalidationPayload(parsed);
    } catch {
      return null;
    }
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  return data as InvalidationPayload;
}

function isCollaborationInvalidation(payload: InvalidationPayload, taskId: string) {
  return (
    payload.taskId === taskId &&
    (payload.type?.startsWith("comment.") ||
      payload.type?.startsWith("attachment."))
  );
}

export function TaskDetailDrawer({
  isOpen,
  onClose,
  projectId,
  task,
  categories,
  statuses,
  projectMembers,
  actorId,
  canManage,
  startEditing = false,
}: TaskDetailDrawerProps) {
  const [collaboration, setCollaboration] = useState<TaskCollaboration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const router = useRouter();

  const refreshCollaboration = useCallback(() => {
    if (!task) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setError(null);
    fetch(`/api/tasks/${task.id}/collaboration`, { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as TaskCollaboration | { error: string };
        if (!response.ok) {
          throw new Error("error" in data ? data.error : "Gagal memuat diskusi.");
        }
        if (!("taskId" in data)) {
          throw new Error("Gagal memuat diskusi.");
        }
        if (requestIdRef.current === requestId) {
          setCollaboration(data);
        }
      })
      .catch((fetchError: unknown) => {
        if (requestIdRef.current === requestId) {
          setError(
            fetchError instanceof Error ? fetchError.message : "Gagal memuat diskusi.",
          );
        }
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      });
  }, [task]);

  useEffect(() => {
    if (!isOpen || !task) {
      return;
    }

    setCollaboration(null);
    refreshCollaboration();
    if (startEditing) {
      setIsEditing(true);
    }
  }, [isOpen, refreshCollaboration, startEditing, task]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    setCollaboration(null);
    setError(null);
    setIsLoading(false);
    setIsEditing(false);
    requestIdRef.current += 1;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !task) {
      return;
    }

    const appKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!appKey || !cluster) {
      return;
    }

    const channelName = `private-project-${projectId}`;
    const pusher = new Pusher(appKey, {
      cluster,
      forceTLS: process.env.NEXT_PUBLIC_PUSHER_TLS !== "false",
      authorizer: (channel) => ({
        authorize: (socketId, callback) => {
          fetch("/api/realtime/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          })
            .then(async (response) => {
              if (!response.ok) {
                throw new Error(`Failed to authenticate Pusher: ${response.status}`);
              }
              return response.json();
            })
            .then((data) => callback(null, data))
            .catch((authError: Error) => callback(authError, { auth: "" }));
        },
      }),
    });
    const channel = pusher.subscribe(channelName);
    const handleInvalidate = (data: unknown) => {
      const payload = parseInvalidationPayload(data);
      if (payload && isCollaborationInvalidation(payload, task.id)) {
        refreshCollaboration();
      }
    };

    channel.bind("simadep.invalidate", handleInvalidate);

    return () => {
      channel.unbind("simadep.invalidate", handleInvalidate);
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [isOpen, projectId, refreshCollaboration, task]);

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
                  {task.status} / {task.priority ?? "tanpa prioritas"} / selesai:{" "}
                  {durationLabel(task.finishedDurationMinutes)}
                </p>
              </div>
              {canManage ? (
                <Button
                  size="sm"
                  variant="bordered"
                  startContent={<Edit size={15} />}
                  onPress={() => setIsEditing((value) => !value)}
                >
                  {isEditing ? "Tutup Edit" : "Edit"}
                </Button>
              ) : null}
            </div>
          </DrawerHeader>

          <div className="flex-1 space-y-7 overflow-y-auto p-6">
            {canManage && isEditing ? (
              <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-3 text-lg font-bold">Edit Tugas</h3>
                <WorkItemActionForm
                  action={updateTaskAction}
                  onSuccess={() => {
                    setIsEditing(false);
                    router.refresh();
                  }}
                >
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="version" value={task.version} />
                  <input type="hidden" name="milestoneId" value={task.milestoneId} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input name="name" label="Nama tugas" defaultValue={task.name} isRequired />
                    <select
                      name="status"
                      defaultValue={task.status}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    >
                      {statuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <select
                      name="priority"
                      defaultValue={task.priority ?? ""}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Tanpa prioritas</option>
                      {taskPriorityOptions.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                    <select
                      name="categoryId"
                      defaultValue={task.categoryId ?? ""}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Tanpa kategori</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <Input
                      name="startDate"
                      label="Mulai"
                      type="date"
                      defaultValue={dateInputValue(task.startDate)}
                    />
                    <Input
                      name="dueDate"
                      label="Tenggat"
                      type="date"
                      defaultValue={dateInputValue(task.dueDate)}
                    />
                    <Input
                      name="estimatedDurationMinutes"
                      label="Estimasi menit"
                      type="number"
                      min={0}
                      defaultValue={task.estimatedDurationMinutes?.toString() ?? ""}
                    />
                    <Input
                      name="displayOrder"
                      label="Urutan"
                      type="number"
                      min={0}
                      defaultValue={task.displayOrder.toString()}
                    />
                    <Textarea
                      name="description"
                      label="Deskripsi"
                      minRows={3}
                      className="sm:col-span-2"
                      defaultValue={task.description ?? ""}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="light"
                      onPress={() => setIsEditing(false)}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      className="bg-[var(--color-primary)] font-bold text-[var(--simadep-foreground)]"
                    >
                      Simpan
                    </Button>
                  </div>
                </WorkItemActionForm>
              </section>
            ) : null}

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
                        {statuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
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
                    <CollaborationActionForm
                      action={deleteAttachmentAction}
                      onSuccess={refreshCollaboration}
                    >
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
                  onSuccess={refreshCollaboration}
                  resetOnSuccess
                >
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="taskId" value={task.id} />
                  <Input type="file" name="file" size="sm" />
                  <Button type="submit" size="sm" variant="bordered" startContent={<Plus size={14} />}>
                    Upload File
                  </Button>
                </CollaborationActionForm>
                <CollaborationActionForm
                  action={createLinkAttachmentAction}
                  onSuccess={refreshCollaboration}
                  resetOnSuccess
                >
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
              <CollaborationActionForm
                action={createCommentAction}
                onSuccess={refreshCollaboration}
                resetOnSuccess
              >
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
                        <CollaborationActionForm
                          action={deleteCommentAction}
                          onSuccess={refreshCollaboration}
                        >
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
