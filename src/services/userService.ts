import { PaginatedUsersResponse } from "../types/user";

class UserService {
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl =
            process.env.NEXT_PUBLIC_API_SMIP_BASE_URL ||
            "https://api-sistem-manajement-proyek.vercel.app";
    }

    private getHeaders(token: string) {
        return {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        };
    }

    /**
     * Mengambil daftar semua pengguna (pegawai)
     * @param token - Token otentikasi
     * @param page - Halaman
     * @param perPage - Jumlah item per halaman
     * @returns Promise yang resolve dengan daftar pengguna
     */
    public async getUsers(
        token: string,
        page = 1,
        perPage = 100 // Ambil 100 user secara default untuk dropdown
    ): Promise<PaginatedUsersResponse> {
        const response = await fetch(
            `${this.baseUrl}/v1/users?page=${page}&per_page=${perPage}`,
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
}

export const userService = new UserService();
