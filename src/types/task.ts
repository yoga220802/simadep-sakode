export interface TaskAssignee {
    user_id: number;
    name: string;
    profile_url: string;
}

export interface Task {
    id: number;
    name: string;
    description: string | null;
    resource_type: "task" | "milestone" | "section";
    status: "pending" | "in_progress" | "completed" | "cancelled" | null;
    priority: "low" | "medium" | "high" | null;
    due_date: string | null;
    start_date: string | null;
    assignees?: TaskAssignee[]; // Opsional sambil menunggu update backend
    sub_tasks?: Task[];
}

// Tipe untuk payload saat membuat task baru
export interface TaskCreate {
    project_id: number;
    name: string;
    description?: string;
    resource_type?: "task" | "milestone" | "section";
    status?: "pending" | "in_progress" | "completed" | "cancelled";
    priority?: "low" | "medium" | "high";
    due_date?: string;
    start_date?: string;
}

// Tipe untuk payload saat mengupdate task
export type TaskUpdate = Omit<TaskCreate, "project_id">;
