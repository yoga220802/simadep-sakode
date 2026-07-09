import type {
    Credentials,
    User,
    AuthSession,
    LoginSuccessResponse,
    ApiUserResponse,
    Role,
} from "../types/auth";
import { API_BASE_URL } from "../config/api";

// Helper untuk memetakan role dari API ke role di frontend
const mapApiRoleToFrontendRole = (apiRole: string): Role => {
    const roleMap: Record<string, Role> = {
        admin: "Admin",
        project_manager: "Project Manager",
        team_member: "Team Member",
    };
    return roleMap[apiRole.toLowerCase()] || "Viewer";
};

class AuthService {
    private readonly baseUrl: string | undefined;

    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    private async getUserProfile(token: string): Promise<ApiUserResponse> {
        const response = await fetch(`${this.baseUrl}/v1/users/me`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || "Gagal memvalidasi sesi pengguna."
            );
        }

        return response.json();
    }

    private mapApiUserToUser(apiUser: ApiUserResponse): User {
        return {
            id: apiUser.id.toString(),
            name: apiUser.name,
            email: apiUser.email,
            role: mapApiRoleToFrontendRole(apiUser.role),
            department: apiUser.work_unit,
            position: apiUser.position,
            profile_url: apiUser.profile_url,
            statistics: apiUser.statistics,
        };
    }

    public async login(credentials: Credentials): Promise<AuthSession> {
        console.log(`Mencoba login dengan username: ${credentials.username}`);

        const body = new URLSearchParams({
            grant_type: "password",
            username: credentials.username,
            password: credentials.password,
        });

        const response = await fetch(`${this.baseUrl}/v1/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
            },
            body: body.toString(),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Login gagal:", errorData);
            throw new Error(
                errorData.message || "Username atau password yang Anda masukkan salah."
            );
        }

        const loginData: LoginSuccessResponse = await response.json();
        const { access_token } = loginData;

        const apiUser = await this.getUserProfile(access_token);
        const user = this.mapApiUserToUser(apiUser);

        console.log(`Login berhasil untuk user: ${user.name}, Role: ${user.role}`);

        return {
            token: access_token,
            user: user,
        };
    }

    public async revalidateSession(token: string): Promise<AuthSession> {
        const apiUser = await this.getUserProfile(token);
        const user = this.mapApiUserToUser(apiUser);

        return {
            token,
            user,
        };
    }
}

export const authService = new AuthService();
