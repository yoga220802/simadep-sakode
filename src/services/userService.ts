import type {
    PaginatedUsersResponse,
    UpdateUserRoleResponse,
} from "@/src/types/user";
import type { UserSummary } from "@/src/types/user";
import { API_BASE_URL } from "../config/api";

class UserService {
    private readonly baseUrl: string | undefined;

    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    private getHeaders(token: string) {
        return {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        };
    }

    // Fungsi ini tetap untuk halaman admin dengan paginasi
    public async getUsers(
        token: string,
        page = 1,
        perPage = 10,
        search = ""
    ): Promise<PaginatedUsersResponse> {
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString(),
        });

        if (search) {
            params.append("search", search);
        }

        const response = await fetch(
            `${this.baseUrl}/v1/users?${params.toString()}`,
            {
                method: "GET",
                headers: this.getHeaders(token),
            }
        );

        if (!response.ok) {
            throw new Error("Gagal mengambil daftar pengguna.");
        }
        return response.json();
    }

    // Fungsi BARU untuk mengambil semua user tanpa paginasi, SEKARANG DENGAN SEARCH
    public async getAllUsers(
        token: string,
        search = ""
    ): Promise<UserSummary[]> {
        const params = new URLSearchParams({
            page: "1",
            per_page: "1000",
        });
        if (search) {
            params.append("search", search);
        }
        const response = await fetch(
            `${this.baseUrl}/v1/users?${params.toString()}`,
            {
                method: "GET",
                headers: this.getHeaders(token),
            }
        );
        if (!response.ok) {
            throw new Error("Gagal mengambil semua pengguna.");
        }
        const data: PaginatedUsersResponse = await response.json();
        return data.items;
    }

    public async updateUserRole(
        token: string,
        userId: number,
        newRole: UserSummary["role"]
    ): Promise<UpdateUserRoleResponse> {
        const response = await fetch(
            `${this.baseUrl}/v1/users/${userId}/role?new_role=${newRole}`,
            {
                method: "PATCH",
                headers: this.getHeaders(token),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal memperbarui peran pengguna.");
        }
        return response.json();
    }
}

export const userService = new UserService();

