// Tipe untuk satu baris data di tabel tugas yang akan datang
export interface UpcomingTask {
    id: string;
    taskName: string;
    projectName: string;
    dueDate: string; // Tenggat Waktu
    priority: 'Tinggi' | 'Sedang' | 'Rendah';
}
