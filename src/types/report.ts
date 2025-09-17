// --- Tipe Data dari API ---
export interface ApiProjectReport {
    project_summary: {
        total_task: number;
        task_complete: number;
        task_not_complete: number;
    };
    assignee: {
        user_id: number;
        email: string;
        profile_url: string;
        task_complete: number;
        task_not_complete: number;
    }[];
    priority: {
        high: number;
        medium: number;
        low: number;
    };
    weakly_report: {
        date: string;
        task_complete: number;
        task_not_complete: number;
    }[];
    // Tambahkan tipe untuk data estimasi dari API
    tasks_estimation: {
        task_id: number;
        milestone_id: number;
        name: string;
        status: string | null;
        finish_duration: number | null;
        estimated_duration: number | null;
    }[];
}

// --- Tipe Data untuk Frontend ---
export interface ReportSummary {
    tasksCompleted: number;
    tasksInProgress: number;
    totalTasks: number;
}

export interface AssigneePerformance {
    assignee: {
        user_id: number;
        name: string;
        avatarUrl?: string;
    };
    selesai: number;
    inProgress: number;
}

export interface PriorityDistribution {
    name: "Rendah" | "Sedang" | "Tinggi";
    value: number;
}

export interface WeeklyActivity {
    date: string;
    selesai: number;
    total: number;
}

// Perbarui tipe TaskEstimation untuk frontend
export interface TaskEstimation {
    name: string;
    estimasi: number; // Durasi estimasi dalam hari
    selesai: number; // Durasi realisasi dalam hari
    milestone_id: number;
}

export interface ProjectReportData {
    summary: ReportSummary;
    assigneePerformance: AssigneePerformance[];
    priorityDistribution: PriorityDistribution[];
    weeklyActivity: WeeklyActivity[];
    taskEstimation: TaskEstimation[];
}
