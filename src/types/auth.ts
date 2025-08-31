// Tipe untuk objek statistik dari API
export interface Statistics {
    total_project: number;
    project_active: number;
    project_completed: number;
    total_task: number;
    task_in_progress: number;
    task_completed: number;
    task_cancelled: number;
}

// Tipe Role yang digunakan di frontend
export type Role = "Admin" | "Project Manager" | "Team Member" | "Viewer";

// Tipe User yang sudah disesuaikan dengan data dari API
export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    department: string;
    position: string;
    avatarUrl?: string;
    statistics?: Statistics;
}

// Kredensial yang dikirim ke service
export interface Credentials {
    username: string;
    password: string;
}

// Sesi otentikasi yang disimpan di frontend
export interface AuthSession {
    token: string;
    user: User;
}

// --- Tipe untuk Respons API ---

// Tipe untuk respons login yang berhasil
export interface LoginSuccessResponse {
    access_token: string;
    token_type: "bearer";
}

// Tipe untuk data user mentah dari API /v1/users/me
export interface ApiUserResponse {
    id: number;
    name: string;
    employee_role: string;
    email: string;
    username: string;
    position: string;
    work_unit: string;
    address: string;
    profile_url: string;
    role: string;
    statistics: Statistics;
}
