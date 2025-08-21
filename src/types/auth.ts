// Tipe Role yang digunakan di frontend
export type Role = "Admin" | "Project Manager" | "Team Member" | "Viewer";

// Tipe User dari API
export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    department: string; // dari 'work_unit'
    position: string;
    avatarUrl?: string; // (Opsional, menunggu update dari backend)
}

// Kredensial yang dikirim ke service
export interface Credentials {
    username: string; // Diubah dari email ke username, ada kemungkinan diubah lagi
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
    employee_role: string; // e.g., "admin", "project_manager"
    email: string;
    username: string;
    position: string;
    work_unit: string;
    address: string;
    // Request Properti ke backend
    // profilePictureUrl?: string;
    // projectCount?: number;
    // taskCount?: number;
}
