// System Roles
export type Role = "Admin" | "Project Manager" | "Team Member";

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
}

export interface Credentials {
    email: string;
    password: string;
}

export interface AuthSession {
    token: string;
    user: User;
}
