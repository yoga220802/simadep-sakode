import type {
    PaginatedProjectsResponse,
    Project,
    ProjectFormData,
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
            throw new Error("Gagal mengambil daftar proyek.");
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
}

export const projectService = new ProjectService();
