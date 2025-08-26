import {
    Users,
    FolderKanban,
    ClipboardList,
    CheckCircle,
    CircleArrowOutDownLeft,
    Shield,
    UserCheck,
    UserCog,
    ListTodo,
} from "lucide-react";
import type { Role } from "../types/auth";
import type {
    StatCardData,
    ChartDataPoint,
    AdminDashboardData,
    PmDashboardData,
    UserDashboardData,
    EmployeeData,
    ProjectData,
    TaskData,
} from "../types/dashboard";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Helper untuk memetakan role dari API ke role di frontend
const mapApiRoleToFrontendRole = (apiRole: string): EmployeeData["role"] => {
    const roleMap: Record<string, EmployeeData["role"]> = {
        admin: "Admin",
        project_manager: "Project Manager",
        team_member: "Team Member",
    };
    return roleMap[apiRole.toLowerCase()] || "Viewer";
};

class DashboardService {
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl =
            process.env.NEXT_PUBLIC_API_SMIP_BASE_URL ||
            "https://api-sistem-manajement-proyek.vercel.app";
    }

    private getHeaders(token: string) {
        return {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        };
    }

    // GET /v1/dashboard/admin
    private async getAdminDashboardData(
        token: string
    ): Promise<AdminDashboardData> {
        const response = await fetch(`${this.baseUrl}/v1/dashboard/admin`, {
            headers: this.getHeaders(token),
        });
        if (!response.ok) throw new Error("Gagal memuat data dashboard admin.");
        return response.json();
    }

    // GET /v1/dashboard/pm
    private async getPmDashboardData(token: string): Promise<PmDashboardData> {
        const response = await fetch(`${this.baseUrl}/v1/dashboard/pm`, {
            headers: this.getHeaders(token),
        });
        if (!response.ok) throw new Error("Gagal memuat data dashboard PM.");
        return response.json();
    }

    // GET /v1/dashboard/user
    private async getUserDashboardData(
        token: string
    ): Promise<UserDashboardData> {
        const response = await fetch(`${this.baseUrl}/v1/dashboard/user`, {
            headers: this.getHeaders(token),
        });
        if (!response.ok) throw new Error("Gagal memuat data dashboard user.");
        return response.json();
    }

    // Fungsi utama untuk mengambil dan memformat data dashboard
    public async getDashboardData(role: Role, token: string) {
        switch (role) {
            case "Admin": {
                const apiData = await this.getAdminDashboardData(token);
                const totalPegawai =
                    (apiData.role_counts.admin || 0) +
                    (apiData.role_counts.project_manager || 0) +
                    (apiData.role_counts.team_member || 0);

                const statCards: StatCardData[] = [
                    {
                        title: "Total Pegawai",
                        value: totalPegawai,
                        icon: Users,
                    },
                    {
                        title: "Admin",
                        value: apiData.role_counts.admin || 0,
                        icon: Shield,
                    },
                    {
                        title: "Project Manager",
                        value: apiData.role_counts.project_manager || 0,
                        icon: UserCog,
                    },
                    {
                        title: "Team Member",
                        value: apiData.role_counts.team_member || 0,
                        icon: UserCheck,
                    },
                ];
                const employees: EmployeeData[] = apiData.top_users.map((user) => ({
                    id: user.id.toString(),
                    name: user.name,
                    avatarUrl: user.profile_url,
                    position: user.position,
                    email: user.email,
                    role: mapApiRoleToFrontendRole(user.role),
                }));
                return { statCards, employees };
            }

            case "Project Manager": {
                const apiData = await this.getPmDashboardData(token);
                const statCards: StatCardData[] = [
                    {
                        title: "Proyek Aktif",
                        value: apiData.project_summary.active_projects,
                        icon: ClipboardList,
                    },
                    {
                        title: "Proyek Selesai",
                        value: apiData.project_summary.completed_projects,
                        icon: CheckCircle,
                    },
                    {
                        title: "Proyek Baru Bulan Ini",
                        value: apiData.project_summary.new_this_month,
                        icon: CircleArrowOutDownLeft,
                    },
                ];
                const projects: ProjectData[] = apiData.upcoming_deadlines.map(
                    (proj) => ({
                        id: proj.id.toString(),
                        name: proj.title,
                        taskCount: 0,
                        dueDate: proj.end_date
                            ? format(new Date(proj.end_date), "dd/MM/yyyy", { locale: id })
                            : "-",
                    })
                );
                const chartData: ChartDataPoint[] = apiData.yearly_summary.map(
                    (summary) => ({
                        month: format(new Date(summary.month), "MMM", { locale: id }),
                        masuk: summary.created_count,
                        selesai: summary.completed_count,
                        berjalan: 0,
                    })
                );
                return { statCards, projects, chartData };
            }

            case "Team Member": {
                const apiData = await this.getUserDashboardData(token);
                const statCards: StatCardData[] = [
                    {
                        title: "Jumlah Tugas",
                        value: apiData.project_summary.total_task,
                        icon: ListTodo,
                    },
                    {
                        title: "Proyek Aktif",
                        value: apiData.project_summary.project_active,
                        icon: FolderKanban,
                    },
                    {
                        title: "Proyek Diterima",
                        value: apiData.project_summary.total_project,
                        icon: FolderKanban,
                    },
                ];
                const tasks: TaskData[] = apiData.upcoming_tasks.map((task) => ({
                    id: task.id.toString(),
                    taskName: task.name,
                    projectName: "N/A",
                    dueDate: task.due_date
                        ? format(new Date(task.due_date), "dd/MM/yyyy", { locale: id })
                        : "-",
                    priority:
                        task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
                }));
                return { statCards, tasks };
            }
            default:
                return { statCards: [], employees: [], projects: [], tasks: [], chartData: [] };
        }
    }
}

export const dashboardService = new DashboardService();
