
class SidebarService {

    /**
     * Mengambil jumlah item aktif untuk menu sidebar.
     * Di aplikasi nyata, ini akan memanggil endpoint API yang berbeda
     * tergantung role user, misal: /api/users/{userId}/menu-counts
     * @returns Promise yang resolve dengan objek berisi jumlah data.
     */
    public async getMenuCounts(): Promise<{ projects: number; tasks: number }> {
        // Mensimulasikan penundaan jaringan
        await new Promise(resolve => setTimeout(resolve, 500));

        // Data dummy
        return {
            projects: 3, // Jumlah proyek aktif user
            tasks: 12,   // Jumlah tugas aktif user
        };
    }
}

export const sidebarService = new SidebarService();
