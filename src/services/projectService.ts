import type {
    PaginatedProjectsResponse,
    Project,
    ProjectFormData,
    ProjectRole, // Import tipe ProjectRole
} from "@/src/types/project";

class ProjectService {
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

    // GET /v1/projects
    public async getProjects(
        token: string,
        page = 1,
        perPage = 10
    ): Promise<PaginatedProjectsResponse> {
        const response = await fetch(
            `${this.baseUrl}/v1/projects?page=${page}&per_page=${perPage}`,
            {
                method: "GET",
                headers: this.getHeaders(token),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Server response:", errorData); // Log server response for debugging
            throw new Error(errorData.message || "Gagal mengambil daftar proyek.");
        }
        return response.json();
    }

    // GET /v1/projects/{project_id}
    public async getProjectById(
        token: string,
        projectId: string
    ): Promise<Project> {
        const response = await fetch(`${this.baseUrl}/v1/projects/${projectId}`, {
            method: "GET",
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("Proyek tidak ditemukan.");
            }
            throw new Error("Gagal mengambil detail proyek.");
        }
        return response.json();
    }

    // POST /v1/projects
    public async createProject(
        token: string,
        projectData: ProjectFormData
    ): Promise<Project> {
        const response = await fetch(`${this.baseUrl}/v1/projects`, {
            method: "POST",
            headers: this.getHeaders(token),
            body: JSON.stringify(projectData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal membuat proyek baru.");
        }
        return response.json();
    }

    // PUT /v1/projects/{project_id}
    public async updateProject(
        token: string,
        projectId: string,
        projectData: Partial<ProjectFormData>
    ): Promise<Project> {
        const response = await fetch(`${this.baseUrl}/v1/projects/${projectId}`, {
            method: "PUT",
            headers: this.getHeaders(token),
            body: JSON.stringify(projectData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal memperbarui proyek.");
        }
        return response.json();
    }

    // DELETE /v1/projects/{project_id}
    public async deleteProject(
        token: string,
        projectId: string
    ): Promise<void> {
        const response = await fetch(`${this.baseUrl}/v1/projects/${projectId}`, {
            method: "DELETE",
            headers: this.getHeaders(token),
        });

        if (response.status !== 202 && response.status !== 204) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal menghapus proyek.");
        }
    }

    // POST /v1/projects/{project_id}/members
    public async addMemberToProject(
        token: string,
        projectId: string,
        userId: number,
        role: ProjectRole
    ): Promise<{ message: string }> {
        const response = await fetch(
            `${this.baseUrl}/v1/projects/${projectId}/members`,
            {
                method: "POST",
                headers: this.getHeaders(token),
                body: JSON.stringify({ user_id: userId, role }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal menambahkan anggota.");
        }
        return response.json();
    }

    // DELETE /v1/projects/{project_id}/members/{user_id}
    public async removeMemberFromProject(
        token: string,
        projectId: string,
        userId: number
    ): Promise<void> {
        const response = await fetch(
            `${this.baseUrl}/v1/projects/${projectId}/members/${userId}`,
            {
                method: "DELETE",
                headers: this.getHeaders(token),
            }
        );

        if (response.status !== 202 && response.status !== 204) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal menghapus anggota.");
        }
    }

    // PATCH /v1/projects/{project_id}/members/{user_id}/role
    public async updateMemberRole(
        token: string,
        projectId: string,
        userId: number,
        role: ProjectRole
    ): Promise<void> {
        const response = await fetch(
            `${this.baseUrl}/v1/projects/${projectId}/members/${userId}/role`,
            {
                method: "PATCH",
                headers: this.getHeaders(token),
                body: JSON.stringify({ role }),
            }
        );

        if (response.status !== 202 && response.status !== 204) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal mengubah peran anggota.");
        }
    }
}

export const projectService = new ProjectService();
