import type { MyTask, Task } from "@/src/types/task";
import { projectService } from "./projectService";
import { API_BASE_URL } from "../config/api";

class MyTaskService {
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

    public async getMyTasks(token: string): Promise<MyTask[]> {
        const response = await fetch(`${this.baseUrl}/v1/users/me/tasks`, {
            method: "GET",
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            throw new Error("Gagal mengambil daftar tugas.");
        }

        const tasks: Task[] = await response.json();

        // Mengambil detail proyek untuk setiap tugas secara paralel
        const tasksWithProjectInfo = await Promise.all(
            tasks.map(async (task) => {
                try {
                    if (task.project_id) {
                        const project = await projectService.getProjectById(
                            token,
                            task.project_id
                        );
                        return {
                            ...task,
                            projectName: project.title,
                            projectId: project.id,
                        };
                    }
                    return {
                        ...task,
                        projectName: "Proyek Tidak Diketahui",
                        projectId: 0,
                    };
                } catch (error) {
                    console.error(
                        `Gagal mengambil detail proyek untuk tugas ID: ${task.id}`,
                        error
                    );
                    return {
                        ...task,
                        projectName: "Proyek Tidak Ditemukan",
                        projectId: task.project_id || 0,
                    };
                }
            })
        );
        return tasksWithProjectInfo;
    }
}

export const myTaskService = new MyTaskService();
