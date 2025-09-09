import type { Attachment } from "./attachment";

export interface Comment {
    id: number;
    task_id: number;
    user_id: number;
    content: string;
    created_at: string;
    attachments: Attachment[];
}

export interface CommentCreatePayload {
    task_id: number;
    content: string;
}
