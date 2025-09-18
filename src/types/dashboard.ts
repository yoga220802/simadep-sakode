import type { LucideIcon } from "lucide-react";
import type { UserSummary } from "./user";
import type { Project } from "./project";
import { StatusTask } from "./task";
// --- Tipe Data Umum Dashboard ---
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
    status: StatusTask | null;
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

// --- Tipe Spesifik untuk Respons API Dashboard ---

// Tambahkan tipe untuk ringkasan proyek
export interface ProjectSummary {
    total_project: number;
    active_projects: number;
    completed_projects: number;
    new_this_month: number;
}

// GET /v1/dashboard/admin
export interface AdminDashboardData {
    top_users: UserSummary[];
    role_counts: {
        admin: number;
        project_manager: number;
        team_member: number;
        [key: string]: number;
    };
    project_summary: ProjectSummary;
}

// GET /v1/dashboard/pm
export interface PmDashboardData {
    project_summary: ProjectSummary;
    yearly_summary: {
        month: string;
        created_count: number;
        actived_count: number;
        completed_count: number;
    }[];
    upcoming_deadlines: (Omit<Project, "members" | "stats"> & {
        task_count?: number;
        task_in_progress?: number;
        start_date?: string;
    })[]; // Extend the type to include missing properties
}

// GET /v1/dashboard/user
export interface UserDashboardData {
    project_summary: {
        total_project: number;
        project_active: number;
        project_completed: number;
        total_task: number;
        task_in_progress: number;
        task_completed: number;
        task_cancelled: number;
    };
    upcoming_tasks: {
        id: number;
        name: string;
        description: string | null;
        status: string;
        priority: "low" | "medium" | "high";
        due_date: string | null;
        start_date: string | null;
    }[];
}
