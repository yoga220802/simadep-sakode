import type { UserSummary } from "./user";

// Tipe-tipe dasar dari API
export type ResourceType = "task" | "milestone" | "section";
export type StatusTask = "pending" | "in_progress" | "completed" | "cancelled";
export type PriorityLevel = "low" | "medium" | "high";

// DIUBAH: Memastikan TaskAssignee memiliki user_id
export interface TaskAssignee {
    user_id: number;
    name: string;
    email: string;
    profile_url: string;
}

// DIUBAH: Tipe Task sekarang lebih ramping, karena milestone jadi entitas sendiri
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
    sub_tasks: Task[]; // Subtask akan punya struktur yang sama
}

// BARU: Tipe untuk Milestone dari API
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

// DIUBAH: Payload create task tidak lagi butuh project_id, karena sudah lewat milestone/parent task
export interface TaskCreatePayload {
    name: string;
    description?: string;
    status?: StatusTask;
    priority?: PriorityLevel;
    due_date?: string;
    start_date?: string;
}

// BARU: Payload untuk membuat milestone
export interface MilestoneCreatePayload {
    title: string;
}

// Payload untuk mengupdate task (tetap sama)
export interface TaskUpdatePayload {
    name?: string;
    description?: string;
    status?: StatusTask;
    priority?: PriorityLevel;
    due_date?: string;
    start_date?: string;
}

// Tipe MyTask untuk halaman "Tugas Saya"
export interface MyTask extends Omit<Task, 'sub_tasks' | 'description' | 'display_order' | 'assignees'> {
    projectName: string;
    projectId: number;
}

