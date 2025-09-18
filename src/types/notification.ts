// Tipe data notifikasi yang sesuai dengan respons API
export interface Notification {
    id: number;
    recipient_id: number;
    type: string;
    message: string;
    created_at: string;
    actor_id: number;
    actor_name: string;
    actor_profile_url: string | null;
    project_id: number;
    project_title: string | null;
    task_id: number | null;
    task_name: string | null;
    is_read: boolean;
    read_at: string | null;
}
