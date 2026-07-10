export interface Notification {
    id: string;
    recipient_id: string;
    type: string;
    title: string;
    message: string;
    created_at: string;
    actor_id: string | null;
    actor_name: string;
    actor_profile_url: string | null;
    project_id: string | null;
    project_title: string | null;
    task_id: string | null;
    task_name: string | null;
    is_read: boolean;
    read_at: string | null;
}
