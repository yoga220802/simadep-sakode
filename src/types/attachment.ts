export interface Attachment {
    id: number;
    task_id: number;
    comment_id: number | null;
    mime_type: string;
    file_name: string;
    file_path: string;
    file_size: string;
    user_id: number;
    created_at: string;
}

export interface AttachmentLinkCreate {
    link: string;
    link_name?: string;
}
