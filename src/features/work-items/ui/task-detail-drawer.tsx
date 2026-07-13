"use client";

import {
  type KeyboardEvent,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  Link as LinkIcon,
  MessageSquare,
  Paperclip,
  Plus,
} from "lucide-react";
import Pusher from "pusher-js";

import type { TaskCollaboration } from "@/src/features/collaboration";
import { useActionToast } from "@/src/shared/ui/use-action-toast";
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
import { workItemActionInitialState } from "../server/action-state";
import { AssignTaskPopover } from "./assign-task-popover";
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

const taskUpdateFieldNames = [
  "milestoneId",
  "name",
  "description",
  "status",
  "priority",
  "categoryId",
  "startDate",
  "dueDate",
  "estimatedDurationMinutes",
  "displayOrder",
] as const;

type TaskUpdateFieldName = (typeof taskUpdateFieldNames)[number];

function taskUpdateValue(task: WorkItemTask, field: TaskUpdateFieldName) {
  const values: Record<TaskUpdateFieldName, string> = {
    milestoneId: task.milestoneId,
    name: task.name,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority ?? "",
    categoryId: task.categoryId ?? "",
    startDate: dateInputValue(task.startDate),
    dueDate: dateInputValue(task.dueDate),
    estimatedDurationMinutes: task.estimatedDurationMinutes?.toString() ?? "",
    displayOrder: task.displayOrder.toString(),
  };

  return values[field];
}

function TaskUpdateHiddenFields({
  projectId,
  task,
  version,
  exclude,
}: {
  projectId: string;
  task: WorkItemTask;
  version: number;
  exclude: TaskUpdateFieldName[];
}) {
  const excluded = new Set<TaskUpdateFieldName>(exclude);

  return (
    <>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="taskId" value={task.id} />
      <input type="hidden" name="version" value={version} />
      {taskUpdateFieldNames.map((field) =>
        excluded.has(field) ? null : (
          <input
            key={field}
            type="hidden"
            name={field}
            value={taskUpdateValue(task, field)}
          />
        ),
      )}
    </>
  );
}

function submitOnEnter(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  event.currentTarget.form?.requestSubmit();
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
}: TaskDetailDrawerProps) {
  const [collaboration, setCollaboration] = useState<TaskCollaboration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const router = useRouter();
  const [updateState, updateAction, isUpdating] = useActionState(
    updateTaskAction,
    workItemActionInitialState,
  );
  const [statusState, statusAction, isChangingStatus] = useActionState(
    changeTaskStatusAction,
    workItemActionInitialState,
  );
  const handledUpdateStateRef = useRef(updateState);
  const handledStatusStateRef = useRef(statusState);
  const [localTaskVersion, setLocalTaskVersion] = useState(task?.version ?? 1);
  useActionToast(updateState, {
    isPending: isUpdating,
    loadingMessage: "Menyimpan perubahan tugas...",
  });
  useActionToast(statusState, {
    isPending: isChangingStatus,
    loadingMessage: "Mengubah status tugas...",
  });

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

    setLocalTaskVersion(task.version);
    setCollaboration(null);
    refreshCollaboration();
  }, [isOpen, refreshCollaboration, task]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    setCollaboration(null);
    setError(null);
    setIsLoading(false);
    requestIdRef.current += 1;
  }, [isOpen]);

  useEffect(() => {
    if (!updateState.ok || !updateState.message || handledUpdateStateRef.current === updateState) {
      return;
    }

    handledUpdateStateRef.current = updateState;
    if (updateState.taskVersion) {
      setLocalTaskVersion(updateState.taskVersion);
    }
    router.refresh();
  }, [router, updateState]);

  useEffect(() => {
    if (!statusState.ok || !statusState.message || handledStatusStateRef.current === statusState) {
      return;
    }

    handledStatusStateRef.current = statusState;
    if (statusState.taskVersion) {
      setLocalTaskVersion(statusState.taskVersion);
    }
    router.refresh();
  }, [router, statusState]);

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
              <div className="min-w-0 flex-1">
                {canManage ? (
                  <form action={updateAction}>
                    <TaskUpdateHiddenFields
                      projectId={projectId}
                      task={task}
                      version={localTaskVersion}
                      exclude={["name"]}
                    />
                    <Input
                      aria-label="Nama tugas"
                      name="name"
                      defaultValue={task.name}
                      variant="underlined"
                      classNames={{
                        input:
                          "text-2xl font-bold text-[var(--color-text-main)]",
                        inputWrapper: "px-0",
                      }}
                      isDisabled={isUpdating}
                      onBlur={(event) => event.currentTarget.form?.requestSubmit()}
                      onKeyDown={submitOnEnter}
                    />
                  </form>
                ) : (
                  <h2 className="text-2xl font-bold text-[var(--color-text-main)]">
                    {task.name}
                  </h2>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  {task.status} / {task.priority ?? "tanpa prioritas"} / selesai:{" "}
                  {durationLabel(task.finishedDurationMinutes)}
                </p>
              </div>
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
                {canManage ? (
                  <form action={updateAction} className="mt-1">
                    <TaskUpdateHiddenFields
                      projectId={projectId}
                      task={task}
                      version={localTaskVersion}
                      exclude={["dueDate"]}
                    />
                    <Input
                      aria-label="Tenggat tugas"
                      name="dueDate"
                      type="date"
                      size="sm"
                      defaultValue={dateInputValue(task.dueDate)}
                      isDisabled={isUpdating}
                      onBlur={(event) => event.currentTarget.form?.requestSubmit()}
                    />
                  </form>
                ) : (
                  <p className="mt-1 font-semibold">{formatTaskDate(task.dueDate)}</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400">Status</p>
                {canManage ? (
                  <form action={updateAction} className="mt-1">
                    <TaskUpdateHiddenFields
                      projectId={projectId}
                      task={task}
                      version={localTaskVersion}
                      exclude={["status"]}
                    />
                    <select
                      aria-label={`Status ${task.name}`}
                      name="status"
                      defaultValue={task.status}
                      disabled={isUpdating}
                      className="w-full rounded-lg border border-gray-200 px-2 py-2 focus:border-[var(--color-accent)] focus:outline-none"
                      onChange={(event) => event.currentTarget.form?.requestSubmit()}
                    >
                      {statuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </form>
                ) : assignedToActor ? (
                  <form action={statusAction} className="mt-1">
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="taskId" value={task.id} />
                    <input type="hidden" name="version" value={localTaskVersion} />
                      <select
                        aria-label={`Status ${task.name}`}
                        name="status"
                        defaultValue={task.status}
                        disabled={isChangingStatus}
                        className="w-full rounded-lg border border-gray-200 px-2 py-2 focus:border-[var(--color-accent)] focus:outline-none"
                        onChange={(event) =>
                          event.currentTarget.form?.requestSubmit()
                        }
                      >
                        {statuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                  </form>
                ) : (
                  <p className="mt-1 font-semibold">{task.status}</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400">Subtask</p>
                <p className="mt-1 font-semibold">{task.subtasks.length} item</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400">Kategori</p>
                {canManage ? (
                  <form action={updateAction} className="mt-1">
                    <TaskUpdateHiddenFields
                      projectId={projectId}
                      task={task}
                      version={localTaskVersion}
                      exclude={["categoryId"]}
                    />
                    <select
                      aria-label="Kategori tugas"
                      name="categoryId"
                      defaultValue={task.categoryId ?? ""}
                      disabled={isUpdating}
                      className="w-full rounded-lg border border-gray-200 px-2 py-2 focus:border-[var(--color-accent)] focus:outline-none"
                      onChange={(event) => event.currentTarget.form?.requestSubmit()}
                    >
                      <option value="">Tanpa kategori</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </form>
                ) : (
                  <p className="mt-1 font-semibold">
                    {task.categoryName ?? "Tanpa kategori"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400">Prioritas</p>
                {canManage ? (
                  <form action={updateAction} className="mt-1">
                    <TaskUpdateHiddenFields
                      projectId={projectId}
                      task={task}
                      version={localTaskVersion}
                      exclude={["priority"]}
                    />
                    <select
                      aria-label="Prioritas tugas"
                      name="priority"
                      defaultValue={task.priority ?? ""}
                      disabled={isUpdating}
                      className="w-full rounded-lg border border-gray-200 px-2 py-2 focus:border-[var(--color-accent)] focus:outline-none"
                      onChange={(event) => event.currentTarget.form?.requestSubmit()}
                    >
                      <option value="">Tanpa prioritas</option>
                      {taskPriorityOptions.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </form>
                ) : (
                  <p className="mt-1 font-semibold">
                    {task.priority ?? "Tanpa prioritas"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400">Mulai</p>
                {canManage ? (
                  <form action={updateAction} className="mt-1">
                    <TaskUpdateHiddenFields
                      projectId={projectId}
                      task={task}
                      version={localTaskVersion}
                      exclude={["startDate"]}
                    />
                    <Input
                      aria-label="Tanggal mulai tugas"
                      name="startDate"
                      type="date"
                      size="sm"
                      defaultValue={dateInputValue(task.startDate)}
                      isDisabled={isUpdating}
                      onBlur={(event) => event.currentTarget.form?.requestSubmit()}
                    />
                  </form>
                ) : (
                  <p className="mt-1 font-semibold">{formatTaskDate(task.startDate)}</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400">Estimasi</p>
                {canManage ? (
                  <form action={updateAction} className="mt-1">
                    <TaskUpdateHiddenFields
                      projectId={projectId}
                      task={task}
                      version={localTaskVersion}
                      exclude={["estimatedDurationMinutes"]}
                    />
                    <Input
                      aria-label="Estimasi durasi tugas"
                      name="estimatedDurationMinutes"
                      type="number"
                      min={0}
                      size="sm"
                      defaultValue={task.estimatedDurationMinutes?.toString() ?? ""}
                      isDisabled={isUpdating}
                      onBlur={(event) => event.currentTarget.form?.requestSubmit()}
                      onKeyDown={submitOnEnter}
                    />
                  </form>
                ) : (
                  <p className="mt-1 font-semibold">
                    {task.estimatedDurationMinutes
                      ? `${task.estimatedDurationMinutes} menit`
                      : "-"}
                  </p>
                )}
              </div>
              {canManage ? (
                <div>
                  <p className="text-xs uppercase text-gray-400">Urutan</p>
                  <form action={updateAction} className="mt-1">
                    <TaskUpdateHiddenFields
                      projectId={projectId}
                      task={task}
                      version={localTaskVersion}
                      exclude={["displayOrder"]}
                    />
                    <Input
                      aria-label="Urutan tugas"
                      name="displayOrder"
                      type="number"
                      min={0}
                      size="sm"
                      defaultValue={task.displayOrder.toString()}
                      isDisabled={isUpdating}
                      onBlur={(event) => event.currentTarget.form?.requestSubmit()}
                      onKeyDown={submitOnEnter}
                    />
                  </form>
                </div>
              ) : null}
            </section>
            {updateState.message || statusState.message ? (
              <p
                className={`text-xs ${
                  updateState.ok || statusState.ok ? "text-[var(--color-accent)]" : "text-[var(--color-secondary)]"
                }`}
              >
                {updateState.message || statusState.message}
              </p>
            ) : null}

            <section>
              <h3 className="mb-2 text-lg font-bold">Deskripsi</h3>
              {canManage ? (
                <form action={updateAction}>
                  <TaskUpdateHiddenFields
                    projectId={projectId}
                    task={task}
                    version={localTaskVersion}
                    exclude={["description"]}
                  />
                  <Textarea
                    aria-label="Deskripsi tugas"
                    name="description"
                    minRows={3}
                    defaultValue={task.description ?? ""}
                    placeholder="Tidak ada deskripsi."
                    isDisabled={isUpdating}
                    onBlur={(event) => event.currentTarget.form?.requestSubmit()}
                  />
                </form>
              ) : (
                <p className="whitespace-pre-wrap text-sm text-gray-600">
                  {task.description || "Tidak ada deskripsi."}
                </p>
              )}
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
              {error ? <p className="text-sm text-[var(--color-secondary)]">{error}</p> : null}
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
                      <input type="hidden" name="taskId" value={task.id} />
                      <input type="hidden" name="attachmentId" value={attachment.id} />
                      <button className="text-xs text-[var(--color-secondary)]">Hapus</button>
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
                          <button className="text-xs text-[var(--color-secondary)]">Hapus</button>
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
