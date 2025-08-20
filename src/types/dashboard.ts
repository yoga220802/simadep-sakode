// Tipe untuk data di kartu statistik yang bisa digunakan di mana saja
export interface StatCardData {
    title: string;
    value: number;
    icon: React.ElementType;
    change?: number; // Dibuat opsional
    changeType?: 'increase' | 'decrease'; // Dibuat opsional
}

// Tipe untuk satu titik data di dalam chart
export interface ChartDataPoint {
    month: string;
    masuk: number;
    berjalan: number;
    selesai: number;
}

// Tipe untuk satu baris data di tabel proyek
export interface RecentProject {
    id: string;
    name: string;
    taskCount: number;
    dueDate: string; // Tenggat Waktu
}
