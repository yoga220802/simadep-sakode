import type { LucideIcon } from "lucide-react";
import type { UserSummary } from "./user"; // Menggunakan UserSummary yang sudah ada
import type { Project } from "./project"; // Menggunakan tipe Project

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
    taskCount: number;
    dueDate: string;
    status: string;
}

export interface TaskData {
    id: string;
    taskName: string;
    projectName: string;
    dueDate: string;
    priority: string; // Dibuat lebih fleksibel
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

// GET /v1/dashboard/admin
export interface AdminDashboardData {
    top_users: UserSummary[];
    role_counts: {
        admin: number;
        project_manager: number;
        team_member: number;
        [key: string]: number; // Untuk properti dinamis lainnya
    };
}

// GET /v1/dashboard/pm
export interface PmDashboardData {
    project_summary: {
        total_project: number;
        active_projects: number;
        completed_projects: number;
        new_this_month: number;
    };
    yearly_summary: {
        month: string;
        created_count: number;
        actived_count: number;
        completed_count: number;
    }[];
    upcoming_deadlines: Omit<Project, "members" | "stats">[]; // Menggunakan sebagian dari tipe Project
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
