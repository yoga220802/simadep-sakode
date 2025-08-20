import { Users, UserCheck } from 'lucide-react';
import type { StatCardData } from '@/src/types/dashboard';
import type { Employee, Client } from '@/src/types/adminDashboard';

/**
 * AdminDashboardService
 * Kelas ini mensimulasikan pengambilan data dari backend untuk dashboard Admin.
 */
class AdminDashboardService {

    public getAdminStatCards(): StatCardData[] {
        return [
            { title: 'Client', value: 6, icon: UserCheck },
            { title: 'Total Pegawai', value: 12, icon: Users },
        ];
    }

    public getEmployees(): Employee[] {
        return [
            { id: 'emp-00', name: 'Admin Utama', avatarUrl: 'https://i.pravatar.cc/40?img=10', position: 'System Administrator', email: 'admin@smip.com', role: 'Admin' }, // Data Admin ditambahkan
            { id: 'emp-01', name: 'D Luffy', avatarUrl: 'https://i.pravatar.cc/40?img=5', position: 'Product Manager', email: 'luffy@gmail.com', role: 'Product Manager' },
            { id: 'emp-02', name: 'Asep Gumasep', avatarUrl: 'https://i.pravatar.cc/40?img=6', position: 'Software Engineer', email: 'cornering99@gmail.com', role: 'Member' },
            { id: 'emp-03', name: 'Baharudin Uno', avatarUrl: 'https://i.pravatar.cc/40?img=7', position: 'Fullstack Developer', email: 'baharudin@gmail.com', role: 'Member' },
            { id: 'emp-04', name: 'Clarissa Putri', avatarUrl: 'https://i.pravatar.cc/40?img=8', position: 'Backend Developer', email: 'clarissa@gmail.com', role: 'Admin' },
            { id: 'emp-05', name: 'Muhammad Maulana Fajar', avatarUrl: 'https://i.pravatar.cc/40?img=9', position: 'UI/UX Desainer', email: 'maulana@gmail.com', role: 'Member' },
        ];
    }

    public getClients(): Client[] {
        return [
            { id: 'cli-01', name: 'Dede Inoen', email: 'dedeinoen@gmail.com', projects: ['Proyek Sembilan'], role: 'Viewer' },
            { id: 'cli-02', name: 'Pria Ganteng', email: 'ganteng123@gmail.com', projects: ['Proyek Delapan'], role: 'Viewer' },
            { id: 'cli-03', name: 'Mas Anies Anies', email: 'baswedan@gmail.com', projects: ['Proyek Keenam', 'Proyek Ketiga'], role: 'Viewer' },
            { id: 'cli-04', name: 'Mulyadi', email: 'mulyadi@gmail.com', projects: ['Proyek Tujuh'], role: 'Viewer' },
            { id: 'cli-05', name: 'Sri Mulyono', email: 'mulyono@gmail.com', projects: ['Proyek Keempat', 'Proyek Kelima'], role: 'Viewer' },
        ];
    }
}

export const adminDashboardService = new AdminDashboardService();
