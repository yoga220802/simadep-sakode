import { ListTodo, Briefcase, FolderKanban } from 'lucide-react';
import type { StatCardData } from '@/src/types/dashboard';
import type { UpcomingTask } from '@/src/types/memberDashboard';

/**
 * MemberDashboardService
 * Kelas ini mensimulasikan pengambilan data dari backend untuk dashboard Team Member.
 */
class MemberDashboardService {

    public getMemberStatCards(): StatCardData[] {
        return [
            { title: 'Jumlah Tugas', value: 12, icon: ListTodo },
            { title: 'Proyek Aktif', value: 3, icon: Briefcase },
            { title: 'Semua Proyek', value: 5, icon: FolderKanban },
        ];
    }

    public getUpcomingTasks(): UpcomingTask[] {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const threeDaysLater = new Date(today);
        threeDaysLater.setDate(today.getDate() + 3);
        const fiveDaysLater = new Date(today);
        fiveDaysLater.setDate(today.getDate() + 5);

        const formatDate = (date: Date) => date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });

        return [
            { id: 'task-01', taskName: 'Perbaikan Bug Halaman Login', projectName: 'Aplikasi SMIP V2', dueDate: formatDate(tomorrow), priority: 'Tinggi' },
            { id: 'task-02', taskName: 'Desain Ulang Komponen Tabel', projectName: 'Website Marketing', dueDate: formatDate(threeDaysLater), priority: 'Sedang' },
            { id: 'task-03', taskName: 'Integrasi API Notifikasi', projectName: 'Aplikasi SMIP V2', dueDate: formatDate(threeDaysLater), priority: 'Tinggi' },
            { id: 'task-04', taskName: 'Rapat Mingguan Tim Frontend', projectName: 'Internal', dueDate: formatDate(fiveDaysLater), priority: 'Rendah' },
        ];
    }
}

export const memberDashboardService = new MemberDashboardService();
