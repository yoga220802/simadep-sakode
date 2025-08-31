import type { Task, TaskCreate, TaskUpdate } from "@/src/types/task";

class TaskService {
    private readonly baseUrl: string | undefined;

    constructor() {
        this.baseUrl =
            process.env.NEXT_PUBLIC_API_SMIP_BASE_URL;
    }

    private getHeaders(token: string) {
        return {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        };
    }

    // GET /v1/projects/{project_id}/tasks
    public async getTasks(
        token: string,
        projectId: number | string
    ): Promise<Task[]> {
        const response = await fetch(
            `${this.baseUrl}/v1/projects/${projectId}/tasks`,
            {
                method: "GET",
                headers: this.getHeaders(token),
            }
        );

        if (!response.ok) {
            throw new Error("Gagal mengambil daftar tugas.");
        }
        return response.json();
    }

    // POST /v1/tasks
    public async createTask(
        token: string,
        taskData: TaskCreate,
        parentTaskId?: number
    ): Promise<Task> {
        let url = `${this.baseUrl}/v1/tasks`;
        if (parentTaskId) {
            url += `?parent_task_id=${parentTaskId}`;
        }

        const response = await fetch(url, {
            method: "POST",
            headers: this.getHeaders(token),
            body: JSON.stringify(taskData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal membuat tugas baru.");
        }
        return response.json();
    }

    // PUT /v1/tasks/{task_id}
    public async updateTask(
        token: string,
        taskId: number,
        taskData: Partial<TaskUpdate>
    ): Promise<Task> {
        const response = await fetch(`${this.baseUrl}/v1/tasks/${taskId}`, {
            method: "PUT",
            headers: this.getHeaders(token),
            body: JSON.stringify(taskData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal memperbarui tugas.");
        }
        return response.json();
    }

    // DELETE /v1/tasks/{task_id}
    public async deleteTask(token: string, taskId: number): Promise<void> {
        const response = await fetch(`${this.baseUrl}/v1/tasks/${taskId}`, {
            method: "DELETE",
            headers: this.getHeaders(token),
        });

        if (response.status !== 202 && response.status !== 204) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal menghapus tugas.");
        }
    }

    // POST /v1/tasks/{task_id}/assign (SIMULASI)
    public async assignTask(
        token: string,
        taskId: number,
        userId: number
    ): Promise<void> {
        console.log(
            `[SIMULASI] Menugaskan user #${userId} ke tugas #${taskId} dengan token: ${token.substring(
                0,
                10
            )}...`
        );
        // const response = await fetch(...)
        // Di sini nanti kode fetch API aslinya
        return Promise.resolve();
    }

    // DELETE /v1/tasks/{task_id}/unassign (SIMULASI)
    public async unassignTask(
        token: string,
        taskId: number,
        userId: number
    ): Promise<void> {
        console.log(
            `[SIMULASI] Melepas penugasan user #${userId} dari tugas #${taskId} dengan token: ${token.substring(
                0,
                10
            )}...`
        );
        // const response = await fetch(...)
        // Di sini nanti kode fetch API aslinya
        return Promise.resolve();
    }
}

export const taskService = new TaskService();
