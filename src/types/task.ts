import type { UserSummary } from "./user";
import type { Attachment } from "./attachment";
import { Category } from "./category";

export type ResourceType = "task" | "milestone" | "section";
export type StatusTask = "pending" | "in_progress" | "completed" | "cancelled";
export type PriorityLevel = "low" | "medium" | "high";

export type TaskSortBy =
    | "display_order"
    | "due_date"
    | "start_date"
    | "title"
    | "created_at"
    | "priority"
    | "status";

export interface TaskAssignee {
    user_id: number;
    name: string;
    email: string;
    profile_url: string;
}

export interface Task {
    id: number;
    name: string;
    description: string | null;
    status: StatusTask | null;
    priority: PriorityLevel | null;
    display_order: number | null;
    due_date: string | null;
    start_date: string | null;
    assignees: TaskAssignee[];
    sub_tasks: Task[];
    attachments: Attachment[];
    category_id: number | null;
    category?: Category | null;
    project_id?: number; // Tambahkan ini untuk relasi ke proyek
}

export interface Milestone {
    id: number;
    project_id: number;
    title: string;
    display_order: number;
    created_at: string;
    updated_at: string | null;
    tasks: Task[];
}

// --- Tipe untuk Payload API ---

export interface TaskCreatePayload {
    name: string;
    description?: string;
    status?: StatusTask;
    priority?: PriorityLevel;
    due_date?: string;
    start_date?: string;
}

export interface MilestoneCreatePayload {
    title: string;
}

export interface MilestoneUpdatePayload {
    title: string;
}

export interface TaskUpdatePayload {
    name?: string;
    description?: string;
    status?: StatusTask;
    priority?: PriorityLevel;
    due_date?: string | null;
    start_date?: string;
    category_id?: number | null;
}

export interface MyTask
    extends Omit<
        Task,
        "sub_tasks" | "description" | "display_order" | "assignees"
    > {
    projectName: string;
    projectId: number;
}
