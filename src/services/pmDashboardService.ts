import type { StatCardData, ChartDataPoint, RecentProject } from '@/src/types/pmDashboard';

class DashboardService {

    public getPmStatCards(): StatCardData[] {
        return [
            { title: 'Proyek Aktif', value: 5, change: -2.31, changeType: 'decrease' },
            { title: 'Proyek Selesai', value: 17, change: 5.67, changeType: 'increase' },
            { title: 'Proyek Masuk', value: 25, change: 10.34, changeType: 'increase' },
        ];
    }

    public getProjectSummaryChartData(): ChartDataPoint[] {
        return [
            { month: 'Jan', masuk: 12, berjalan: 8, selesai: 1 },
            { month: 'Feb', masuk: 16, berjalan: 11, selesai: 2 },
            { month: 'Mar', masuk: 14, berjalan: 12, selesai: 3 },
            { month: 'Apr', masuk: 13, berjalan: 10, selesai: 3 },
            { month: 'Mei', masuk: 11, berjalan: 9, selesai: 4 },
            { month: 'Jun', masuk: 10, berjalan: 10, selesai: 5 },
            { month: 'Jul', masuk: 12, berjalan: 10, selesai: 5 },
            { month: 'Agu', masuk: 15, berjalan: 10, selesai: 6 },
            { month: 'Sep', masuk: 13, berjalan: 9, selesai: 7 },
            { month: 'Okt', masuk: 11, berjalan: 8, selesai: 8 },
            { month: 'Nov', masuk: 9, berjalan: 6, selesai: 8 },
            { month: 'Des', masuk: 8, berjalan: 4, selesai: 9 },
        ];
    }

    public getRecentProjects(): RecentProject[] {
        return [
            { id: 'proj-004', name: 'Proyek Keempat', taskCount: 4, dueDate: '31/08/2025' },
            { id: 'proj-001', name: 'Proyek Kesatu', taskCount: 8, dueDate: '10/09/2025' },
            { id: 'proj-002', name: 'Proyek Kedua', taskCount: 7, dueDate: '29/09/2025' },
            { id: 'proj-009', name: 'Proyek Ketiga', taskCount: 9, dueDate: '17/10/2025' },
            { id: 'proj-015', name: 'Proyek Kelima', taskCount: 15, dueDate: '05/11/2025' },
        ];
    }
}

export const dashboardService = new DashboardService();