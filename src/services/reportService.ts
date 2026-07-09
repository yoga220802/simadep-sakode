import type {
    ApiProjectReport,
    AssigneePerformance,
    PriorityDistribution,
    ProjectReportData,
    TaskEstimation,
    WeeklyActivity,
} from "@/src/types/report";
import { API_BASE_URL } from "../config/api";

// Helper untuk mengubah durasi dari menit ke hari (dengan asumsi 24 jam per hari)
const convertMinutesToDays = (durationInMinutes: number | null): number => {
    if (durationInMinutes === null || durationInMinutes === 0) return 0;
    const hoursPerDay = 24; // Menggunakan 24 jam sebagai basis
    const days = durationInMinutes / 60 / hoursPerDay;
    // Bulatkan ke satu desimal untuk presisi
    return parseFloat(days.toFixed(1));
};
class ReportService {
    private readonly baseUrl: string | undefined;

    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    private getHeaders(token: string) {
        return {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        };
    }

    private transformApiData(apiData: ApiProjectReport): ProjectReportData {
        const assigneePerformance: AssigneePerformance[] = apiData.assignee.map(
            (item) => ({
                assignee: {
                    user_id: item.user_id,
                    name: item.email.split("@")[0], // Ambil nama dari email sebagai fallback
                    avatarUrl: item.profile_url,
                },
                selesai: item.task_complete,
                inProgress: item.task_not_complete,
            })
        );

        const priorityDistribution: PriorityDistribution[] = [
            { name: "Tinggi", value: apiData.priority.high },
            { name: "Sedang", value: apiData.priority.medium },
            { name: "Rendah", value: apiData.priority.low },
        ];

        const weeklyActivity: WeeklyActivity[] = apiData.weakly_report.map(
            (item) => ({
                date: new Date(item.date).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "2-digit",
                }),
                selesai: item.task_complete,
                total: item.task_complete + item.task_not_complete,
            })
        );

        // Transformasi data estimasi tugas dengan konversi dari menit ke hari
        const taskEstimation: TaskEstimation[] = apiData.tasks_estimation.map(
            (item) => ({
                name: item.name,
                estimasi: convertMinutesToDays(item.estimated_duration),
                selesai: convertMinutesToDays(item.finish_duration),
                milestone_id: item.milestone_id,
            })
        );

        return {
            summary: {
                tasksCompleted: apiData.project_summary.task_complete,
                tasksInProgress: apiData.project_summary.task_not_complete,
                totalTasks: apiData.project_summary.total_task,
            },
            assigneePerformance,
            priorityDistribution,
            weeklyActivity,
            taskEstimation, // Masukkan data yang sudah ditransformasi
        };
    }

    public async getProjectReport(
        token: string,
        projectId: string | number
    ): Promise<ProjectReportData> {
        const response = await fetch(
            `${this.baseUrl}/v1/projects/${projectId}/report`,
            {
                method: "GET",
                headers: this.getHeaders(token),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || "Gagal mengambil data laporan proyek."
            );
        }

        const apiData: ApiProjectReport = await response.json();
        return this.transformApiData(apiData);
    }
}

export const reportService = new ReportService();

