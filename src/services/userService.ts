import type {
    PaginatedUsersResponse,
    UpdateUserRoleResponse,
} from "@/src/types/user";
import type { UserSummary } from "@/src/types/user";

class UserService {
    private readonly baseUrl: string | undefined;

    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_API_SMIP_BASE_URL;
    }

    private getHeaders(token: string) {
        return {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        };
    }

    public async getUsers(
        token: string,
        page = 2,
        perPage = 20,
        search = ""
    ): Promise<PaginatedUsersResponse> {
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString(),
        });

        if (search) {
            params.append("search", search);
        }

        const response = await fetch(`${this.baseUrl}/v1/users?${params.toString()}`, {
            method: "GET",
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            throw new Error("Gagal mengambil daftar pengguna.");
        }
        return response.json();
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
