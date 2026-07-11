import type { TaskCollaboration } from "../application/contracts";
import {
  createCommentAction,
  createFileAttachmentAction,
  createLinkAttachmentAction,
  deleteAttachmentAction,
  deleteCommentAction,
} from "../server/collaboration-actions";
import { CollaborationActionForm } from "./collaboration-action-form";

type TaskCollaborationPanelProps = {
  projectId: string;
  taskId: string;
  collaboration?: TaskCollaboration;
};

function formatBytes(size: number | null) {
  if (!size) {
    return "Link";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentList({
  projectId,
  attachments,
}: {
  projectId: string;
  attachments: NonNullable<TaskCollaboration["taskAttachments"]>;
}) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex flex-col gap-1 rounded border border-gray-100 bg-gray-50 px-2 py-1 text-xs sm:flex-row sm:items-center sm:justify-between"
        >
          <a
            href={attachment.externalUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-gray-700 hover:text-[var(--color-primary)]"
          >
            {attachment.fileName}
          </a>
          <div className="flex items-center gap-2 text-gray-500">
            <span>{formatBytes(attachment.sizeBytes)}</span>
            <CollaborationActionForm action={deleteAttachmentAction}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="attachmentId" value={attachment.id} />
              <button className="text-red-600">Hapus</button>
            </CollaborationActionForm>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TaskCollaborationPanel({
  projectId,
  taskId,
  collaboration,
}: TaskCollaborationPanelProps) {
  const comments = collaboration?.comments ?? [];
  const taskAttachments = collaboration?.taskAttachments ?? [];

  return (
    <details className="rounded border border-gray-100 bg-gray-50 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-gray-800">
        Diskusi & Lampiran ({comments.length + taskAttachments.length})
      </summary>

      <div className="mt-3 grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-3">
          <CollaborationActionForm action={createCommentAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="taskId" value={taskId} />
            <textarea
              name="content"
              placeholder="Tulis komentar..."
              className="min-h-20 w-full rounded border border-gray-200 px-3 py-2 text-sm"
              required
            />
            <button className="rounded bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white">
              Kirim Komentar
            </button>
          </CollaborationActionForm>

          <div className="space-y-2">
            {comments.map((comment) => (
              <article
                key={comment.id}
                className="space-y-2 rounded border border-gray-100 bg-white p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {comment.authorName ?? comment.userId}
                    </p>
                    <p className="text-xs text-gray-500">
                      {comment.createdAt.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <CollaborationActionForm action={deleteCommentAction}>
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="taskId" value={taskId} />
                    <input type="hidden" name="commentId" value={comment.id} />
                    <button className="text-xs text-red-600">Hapus</button>
                  </CollaborationActionForm>
                </div>
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {comment.content}
                </p>
                <AttachmentList
                  projectId={projectId}
                  attachments={comment.attachments}
                />
                <details className="rounded border border-dashed border-gray-100 p-2">
                  <summary className="cursor-pointer text-xs font-semibold">
                    Tambah lampiran komentar
                  </summary>
                  <AttachmentForms
                    projectId={projectId}
                    taskId={taskId}
                    commentId={comment.id}
                  />
                </details>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-800">Lampiran Task</p>
          <AttachmentList projectId={projectId} attachments={taskAttachments} />
          <AttachmentForms projectId={projectId} taskId={taskId} />
        </div>
      </div>
    </details>
  );
}

function AttachmentForms({
  projectId,
  taskId,
  commentId,
}: {
  projectId: string;
  taskId: string;
  commentId?: string;
}) {
  return (
    <div className="mt-2 space-y-2">
      <CollaborationActionForm
        action={createFileAttachmentAction}
      >
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="taskId" value={taskId} />
        {commentId ? <input type="hidden" name="commentId" value={commentId} /> : null}
        <input
          type="file"
          name="file"
          className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs"
        />
        <button className="rounded border border-gray-200 px-2 py-1 text-xs font-semibold">
          Upload File
        </button>
      </CollaborationActionForm>

      <CollaborationActionForm action={createLinkAttachmentAction}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="taskId" value={taskId} />
        {commentId ? <input type="hidden" name="commentId" value={commentId} /> : null}
        <input
          name="link"
          placeholder="https://..."
          className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
        />
        <input
          name="linkName"
          placeholder="Nama link"
          className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
        />
        <button className="rounded border border-gray-200 px-2 py-1 text-xs font-semibold">
          Tambah Link
        </button>
      </CollaborationActionForm>
    </div>
  );
}
