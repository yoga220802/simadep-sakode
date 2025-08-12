// System Roles
export type Role = "Admin" | "Project Manager" | "Team Member";

export interface User {
    id: string
    name: string;
    email: string;
    role: Role;
    department: string;
    position: string;
}

export interface Credentials {
    email: string;
    password: string;
}

export interface AuthSession {
    token: string;
    user: User;
}
