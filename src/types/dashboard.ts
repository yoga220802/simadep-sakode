import type { LucideIcon } from "lucide-react";

export type DashboardTaskStatus =
    | "pending"
    | "in_progress"
    | "completed"
    | "cancelled";

export interface StatCardData {
    title: string;
    value: number | string;
    icon: LucideIcon;
    change?: number;
    changeType?: "increase" | "decrease";
}

export interface ChartDataPoint {
    month: string;
    masuk: number;
    berjalan: number;
    selesai: number;
}

// --- Tipe untuk Tabel ---
export interface ProjectData {
    id: string;
    name: string;
    totalTasks: number;
    tasksCompleted: number;
    task_count: number;
    task_in_progress: number;
    startDate: string;
    dueDate: string;
}

export interface TaskData {
    id: string;
    taskName: string;
    status: DashboardTaskStatus | null;
    dueDate: string;
    priority: string;
}

export interface EmployeeData {
    id: string;
    name: string;
    profile_url: string;
    position: string;
    email: string;
    role: "Admin" | "Project Manager" | "Team Member" | "Viewer";
}
