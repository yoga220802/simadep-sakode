import type {
    ApiProjectReport,
    AssigneePerformance,
    PriorityDistribution,
    ProjectReportData,
    WeeklyActivity,
} from "@/src/types/report";

class ReportService {
    private readonly baseUrl: string | undefined;

    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_API_SMIP_BASE_URL;
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

        return {
            summary: {
                tasksCompleted: apiData.project_summary.task_complete,
                tasksInProgress: apiData.project_summary.task_not_complete,
                totalTasks: apiData.project_summary.total_task,
            },
            assigneePerformance,
            priorityDistribution,
            weeklyActivity,
            taskEstimation: [], // API tidak menyediakan data ini, kita kosongkan
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
