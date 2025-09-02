import type { ProjectMember } from "./project";

// Tipe untuk data ringkasan di bagian atas
export interface ReportSummary {
    tasksCompleted: number;
    tasksInProgress: number;
    totalTasks: number;
}

// Tipe untuk data chart penerima tugas
export interface AssigneePerformance {
    assignee: {
        user_id: number;
        name: string;
        avatarUrl?: string;
    };
    selesai: number;
    inProgress: number;
}

// Tipe untuk data chart prioritas tugas
export interface PriorityDistribution {
    name: "Rendah" | "Sedang" | "Tinggi";
    value: number;
}

// Tipe untuk data chart aktivitas mingguan
export interface WeeklyActivity {
    date: string; // Format: "DD/MM"
    selesai: number;
    total: number;
}

// Tipe untuk data chart perbandingan estimasi
export interface TaskEstimation {
    name: string;
    estimasi: number; // dalam hari
    selesai: number; // dalam hari
}

// Tipe utama yang menggabungkan semua data laporan
export interface ProjectReportData {
    summary: ReportSummary;
    assigneePerformance: AssigneePerformance[];
    priorityDistribution: PriorityDistribution[];
    weeklyActivity: WeeklyActivity[];
    taskEstimation: TaskEstimation[];
}

