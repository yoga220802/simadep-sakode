// Tipe untuk satu user dari endpoint GET /v1/users
export interface UserSummary {
    id: number;
    name: string;
    employee_role: string;
    email: string;
    position: string;
    work_unit: string;
    address: string;
    profile_url: string;
    role: "admin" | "project_manager" | "team_member";
}

// Tipe untuk respons dari API GET /v1/users
export interface PaginatedUsersResponse {
    count: number;
    items: UserSummary[];
}

// Tipe untuk payload saat update role
export interface UpdateUserRolePayload {
    role: "admin" | "project_manager" | "team_member";
}
