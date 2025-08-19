// Tipe untuk data di kartu statistik Admin
export interface AdminStatCardData {
    title: string;
    value: number;
    icon: React.ElementType;
}

// Tipe untuk data Pengguna (Pegawai)
export interface Employee {
    id: string;
    name: string;
    avatarUrl: string;
    position: string;
    email: string;
    role: 'Product Manager' | 'Member' | 'Admin';
}

// Tipe untuk data Klien
export interface Client {
    id: string;
    name: string;
    email: string;
    projects: string[];
    role: 'Viewer';
}
