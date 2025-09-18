import type { Attachment } from "./attachment";

// Tipe untuk detail audit dari API
export type TaskActionType =
    | "task.status.changed"
    | "task.title.changed"
    | "task.assigned.added"
    | "task.assigned.removed";

export interface TaskStatusChangeAuditSchema {
    old_status: string;
    new_status: string;
}

export interface TaskTitleChangeAuditSchema {
    before: string;
    after: string;
}

export interface TaskAssignAddedAuditSchama {
    assignee_id: string;
    assignee_name: string;
}

export interface TaskAssignRemovedAuditSchama {
    assignee_id: string;
    assignee_name: string;
}

// Union type untuk berbagai detail audit
export type TaskAuditListSchema =
    | TaskStatusChangeAuditSchema
    | TaskTitleChangeAuditSchema
    | TaskAssignAddedAuditSchama
    | TaskAssignRemovedAuditSchama;

// Tipe utama untuk sebuah entri audit
export interface TaskAuditSchema {
    audit_id: number;
    user_id: number;
    profile_url: string;
    user_name: string;
    task_id: string;
    created_at: string;
    action_type: TaskActionType;
    details: TaskAuditListSchema;
    content: string; // Konten yang sudah diformat dari backend
}

// Tipe untuk detail komentar (sebelumnya `Comment`)
export interface CommentDetail {
    id: number;
    task_id: number;
    user_id: number;
    content: string;
    created_at: string;
    profile_url: string | null;
    user_name: string | null;
    attachments: Attachment[];
}

// Tipe wrapper untuk entri komentar dari API
export interface CommentWithCommentRead {
    type: "comment";
    data: CommentDetail;
}

// Tipe wrapper untuk entri audit dari API
export interface CommentWithAuditRead {
    type: "audit";
    data: TaskAuditSchema;
}

// Tipe union untuk item di timeline (komentar atau audit)
export type TimelineItem = CommentWithCommentRead | CommentWithAuditRead;

// Tipe untuk membuat komentar baru
export interface CommentCreatePayload {
    task_id: number;
    content: string;
}
