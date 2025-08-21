import type {
    Credentials,
    User,
    AuthSession,
    LoginSuccessResponse,
    ApiUserResponse,
    Role,
} from "../types/auth";

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
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl =
            process.env.NEXT_PUBLIC_API_SMIP_BASE_URL ||
            "https://api-sistem-manajement-proyek.vercel.app";
    }

    /**
     * Mengambil profil pengguna dari API menggunakan token.
     * @param token - Access token dari proses login.
     * @returns Promise yang resolve dengan data pengguna dari API.
     */
    private async getUserProfile(token: string): Promise<ApiUserResponse> {
        const response = await fetch(`${this.baseUrl}/v1/users/me`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            // Jika token tidak valid (misal: 401 Unauthorized atau 422), lempar error
            const errorData = await response.json();
            throw new Error(
                errorData.message || "Gagal memvalidasi sesi pengguna."
            );
        }

        return response.json();
    }

    /**
     * Melakukan proses login ke API backend.
     * @param credentials - Username dan password pengguna.
     * @returns Promise yang resolve dengan AuthSession jika berhasil.
     * @throws Error jika login gagal atau data tidak valid.
     */
    public async login(credentials: Credentials): Promise<AuthSession> {
        console.log(`Mencoba login dengan username: ${credentials.username}`);

        const body = new URLSearchParams({
            grant_type: "password",
            username: credentials.username,
            password: credentials.password,
            scope: "",
            client_id: "",
            client_secret: "",
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

        // Setelah mendapatkan token, ambil data profil pengguna
        const apiUser = await this.getUserProfile(access_token);

        // Memetakan data dari API ke tipe User yang digunakan di frontend
        const user: User = {
            id: apiUser.id.toString(),
            name: apiUser.name,
            email: apiUser.email,
            role: mapApiRoleToFrontendRole(apiUser.employee_role),
            department: apiUser.work_unit,
            position: apiUser.position,
            // avatarUrl akan ditambahkan jika sudah ada di API
        };

        console.log(`Login berhasil untuk user: ${user.name}, Role: ${user.role}`);

        return {
            token: access_token,
            user: user,
        };
    }

    /**
     * Memvalidasi ulang sesi pengguna menggunakan token yang ada.
     * @param token - Token dari cookie.
     * @returns Promise yang resolve dengan AuthSession jika token valid.
     */
    public async revalidateSession(token: string): Promise<AuthSession> {
        const apiUser = await this.getUserProfile(token);

        const user: User = {
            id: apiUser.id.toString(),
            name: apiUser.name,
            email: apiUser.email,
            role: mapApiRoleToFrontendRole(apiUser.employee_role),
            department: apiUser.work_unit,
            position: apiUser.position,
        };

        return {
            token,
            user,
        };
    }
}

export const authService = new AuthService();
