import type { ProjectMember, ProjectRole } from "./project";

export type ResourceType = "task" | "milestone" | "section";
export type StatusTask = "pending" | "in_progress" | "completed" | "cancelled";
export type PriorityLevel = "low" | "medium" | "high";

// Tipe untuk assignee dari API (UserTaskAssignmentResponse)
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
    resource_type: ResourceType;
    status: StatusTask | null;
    priority: PriorityLevel | null;
    display_order: number | null;
    due_date: string | null;
    start_date: string | null;
    estimated_duration: number | null;
    sub_tasks?: Task[];
    assignees?: TaskAssignee[];
}

// --- Tipe baru untuk halaman "My Tasks" ---
export interface MyTask extends Task {
    projectName: string;
    projectId: number;
}
// -----------------------------------------

// Payload untuk membuat task baru
export interface TaskCreatePayload {
    project_id?: number; // Opsional karena bisa jadi subtask
    name: string;
    description?: string;
    resource_type?: ResourceType;
    status?: StatusTask;
    priority?: PriorityLevel;
    due_date?: string;
    start_date?: string;
}

// Payload untuk mengupdate task
export interface TaskUpdatePayload {
    name?: string;
    description?: string;
    status?: StatusTask;
    priority?: PriorityLevel;
    due_date?: string;
    start_date?: string;
}

// Payload untuk mengupdate status task saja
export interface TaskStatusUpdatePayload {
    status: StatusTask;
}

