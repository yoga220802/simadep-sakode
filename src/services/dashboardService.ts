import {
    Users,
    UserCheck,
    ListTodo,
    Briefcase,
    FolderKanban,
    ClipboardList,
    CheckCircle,
    CircleArrowOutDownLeft,
} from "lucide-react";
import { Role } from "../types/auth";
import { EmployeeData, ClientData, ProjectData, TaskData, StatCardData, ChartDataPoint } from "../types/dashboard";

class DashboardService {
    // --- Data Dummy ---
    private getEmployees(): EmployeeData[] {
        return [
            {
                id: "emp-00",
                name: "Admin Utama",
                avatarUrl: "https://i.pravatar.cc/40?img=10",
                position: "System Administrator",
                email: "admin@smip.com",
                role: "Admin",
            },
            {
                id: "emp-01",
                name: "D Luffy",
                avatarUrl: "https://i.pravatar.cc/40?img=5",
                position: "Product Manager",
                email: "luffy@gmail.com",
                role: "Project Manager",
            },
            {
                id: "emp-02",
                name: "Asep Gumasep",
                avatarUrl: "https://i.pravatar.cc/40?img=6",
                position: "Software Engineer",
                email: "cornering99@gmail.com",
                role: "Team Member",
            },
        ];
    }

    private getClients(): ClientData[] {
        return [
            {
                id: "cli-01",
                name: "Dede Inoen",
                email: "dedeinoen@gmail.com",
                projects: ["Proyek Sembilan"],
                role: "Viewer",
            },
            {
                id: "cli-02",
                name: "Pria Ganteng",
                email: "ganteng123@gmail.com",
                projects: ["Proyek Delapan"],
                role: "Viewer",
            },
        ];
    }

    private getProjects(): ProjectData[] {
        return [
            {
                id: "proj-004",
                name: "Proyek Keempat",
                taskCount: 4,
                dueDate: "31/08/2025",
            },
            {
                id: "proj-001",
                name: "Proyek Kesatu",
                taskCount: 8,
                dueDate: "10/09/2025",
            },
        ];
    }

    private getTasks(): TaskData[] {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const threeDaysLater = new Date(today);
        threeDaysLater.setDate(today.getDate() + 3);

        const formatDate = (date: Date) =>
            date.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });

        return [
            {
                id: "task-01",
                taskName: "Perbaikan Bug Halaman Login",
                projectName: "Aplikasi SMIP V2",
                dueDate: formatDate(tomorrow),
                priority: "Tinggi",
            },
            {
                id: "task-02",
                taskName: "Desain Ulang Komponen Tabel",
                projectName: "Website Marketing",
                dueDate: formatDate(threeDaysLater),
                priority: "Sedang",
            },
        ];
    }

    // --- Metode Publik ---
    public getStatCardsByRole(role: Role): StatCardData[] {
        switch (role) {
            case "Admin":
                return [
                    { title: "Client", value: 6, icon: UserCheck },
                    { title: "Total Pegawai", value: 12, icon: Users },
                ];
            case "Project Manager":
                return [
                    {
                        title: "Proyek Aktif",
                        value: 5,
                        change: -2.31,
                        changeType: "decrease",
                        icon: ClipboardList,
                    },
                    {
                        title: "Proyek Selesai",
                        value: 17,
                        change: 5.67,
                        changeType: "increase",
                        icon: CheckCircle,
                    },
                    {
                        title: "Proyek Masuk",
                        value: 25,
                        change: 10.34,
                        changeType: "increase",
                        icon: CircleArrowOutDownLeft,
                    },
                ];
            case "Team Member":
                return [
                    { title: "Jumlah Tugas", value: 12, icon: ListTodo },
                    { title: "Proyek Aktif", value: 3, icon: Briefcase },
                    { title: "Semua Proyek", value: 5, icon: FolderKanban },
                ];
            default:
                return [];
        }
    }

    public getProjectSummaryChartData(): ChartDataPoint[] {
        return [
            { month: "Jan", masuk: 12, berjalan: 8, selesai: 1 },
            { month: "Feb", masuk: 16, berjalan: 11, selesai: 2 },
            { month: "Mar", masuk: 14, berjalan: 12, selesai: 3 },
            { month: "Apr", masuk: 13, berjalan: 10, selesai: 3 },
            { month: "Mei", masuk: 11, berjalan: 9, selesai: 4 },
            { month: "Jun", masuk: 10, berjalan: 10, selesai: 5 },
        ];
    }

    public getDashboardData(role: Role) {
        console.log(`Fetching dashboard data for role: ${role}`);
        switch (role) {
            case "Admin":
                return {
                    employees: this.getEmployees(),
                    clients: this.getClients(),
                };
            case "Project Manager":
                return {
                    projects: this.getProjects(),
                    chartData: this.getProjectSummaryChartData(),
                };
            case "Team Member":
                return {
                    tasks: this.getTasks(),
                };
            default:
                return {};
        }
    }
}

export const dashboardService = new DashboardService();
