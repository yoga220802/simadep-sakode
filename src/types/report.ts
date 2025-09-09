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

export interface TaskEstimation {
    name: string;
    estimasi: number;
    selesai: number;
}

export interface ProjectReportData {
    summary: ReportSummary;
    assigneePerformance: AssigneePerformance[];
    priorityDistribution: PriorityDistribution[];
    weeklyActivity: WeeklyActivity[];
    taskEstimation: TaskEstimation[];
}
