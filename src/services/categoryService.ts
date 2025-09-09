import { Category, CategoryCreatePayload, CategoryUpdatePayload } from "../types/category";


class CategoryService {
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

    public async getCategories(
        token: string,
        projectId: number
    ): Promise<Category[]> {
        const response = await fetch(
            `${this.baseUrl}/v1/projects/${projectId}/categories`,
            {
                method: "GET",
                headers: this.getHeaders(token),
            }
        );
        if (!response.ok) {
            throw new Error("Gagal mengambil daftar kategori.");
        }
        return response.json();
    }

    public async createCategory(
        token: string,
        projectId: number,
        payload: CategoryCreatePayload
    ): Promise<Category> {
        const response = await fetch(
            `${this.baseUrl}/v1/projects/${projectId}/categories`,
            {
                method: "POST",
                headers: this.getHeaders(token),
                body: JSON.stringify(payload),
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal membuat kategori baru.");
        }
        return response.json();
    }

    public async updateCategory(
        token: string,
        categoryId: number,
        payload: CategoryUpdatePayload
    ): Promise<Category> {
        const response = await fetch(
            `${this.baseUrl}/v1/categories/${categoryId}`,
            {
                method: "PUT",
                headers: this.getHeaders(token),
                body: JSON.stringify(payload),
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal memperbarui kategori.");
        }
        return response.json();
    }

    public async deleteCategory(
        token: string,
        projectId: number,
        categoryId: number
    ): Promise<void> {
        const response = await fetch(
            `${this.baseUrl}/v1/categories/${categoryId}?project_id=${projectId}`,
            {
                method: "DELETE",
                headers: this.getHeaders(token),
            }
        );
        if (response.status !== 202) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal menghapus kategori.");
        }
    }

    public async assignCategoryToTask(
        token: string,
        taskId: number,
        categoryId: number
    ): Promise<void> {
        const response = await fetch(
            `${this.baseUrl}/v1/tasks/${taskId}/categories/${categoryId}/assign`,
            {
                method: "POST",
                headers: this.getHeaders(token),
            }
        );
        if (response.status !== 201) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal menetapkan kategori.");
        }
    }

    public async unassignCategoryFromTask(
        token: string,
        taskId: number
    ): Promise<void> {
        const response = await fetch(
            `${this.baseUrl}/v1/tasks/${taskId}/categories/unassign`,
            {
                method: "DELETE",
                headers: this.getHeaders(token),
            }
        );
        if (response.status !== 202) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal melepas kategori.");
        }
    }
}

export const categoryService = new CategoryService();
