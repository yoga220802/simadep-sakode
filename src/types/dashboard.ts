import type { LucideIcon } from "lucide-react";
import type { Role } from "./auth";

// --- Dashboard ---
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

// --- Tables ---
export interface ProjectData {
    id: string;
    name: string;
    taskCount: number;
    dueDate: string;
}

export interface TaskData {
    id: string;
    taskName: string;
    projectName: string;
    dueDate: string;
    priority: "Tinggi" | "Sedang" | "Rendah";
}

export interface EmployeeData {
    id: string;
    name: string;
    avatarUrl: string;
    position: string;
    email: string;
    role: "Admin" | "Project Manager" | "Team Member";
}

export interface ClientData {
    id: string;
    name: string;
    email: string;
    projects: string[];
    role: "Viewer";
}

// --- Sidebar ---
export interface MenuCounts {
    projects: number;
    tasks: number;
}
