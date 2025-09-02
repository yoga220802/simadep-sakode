import type { ProjectMember } from "./project";

export type ResourceType = "task" | "milestone" | "section";
export type StatusTask = "pending" | "in_progress" | "completed" | "cancelled";
export type PriorityLevel = "low" | "medium" | "high";

// Untuk assignee, kita gunakan tipe ProjectMember karena datanya berasal dari situ
export type TaskAssignee = ProjectMember;

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

// Payload untuk membuat task baru
export interface TaskCreatePayload {
    project_id: number;
    name: string;
    description?: string;
    resource_type: ResourceType;
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

