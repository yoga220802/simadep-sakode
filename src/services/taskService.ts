import type {
	Task,
	TaskCreatePayload,
	TaskUpdatePayload,
	TaskStatusUpdatePayload,
} from "@/src/types/task";

class TaskService {
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

	public async getTasks(token: string, projectId: string | number): Promise<Task[]> {
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

	public async createTask(
		token: string,
		taskData: TaskCreatePayload,
		parentTaskId?: number
	): Promise<Task> {
		const url = new URL(`${this.baseUrl}/v1/tasks`);
		if (parentTaskId) {
			url.searchParams.append("parent_task_id", String(parentTaskId));
		}
		const response = await fetch(url.toString(), {
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

	public async updateTask(
		token: string,
		taskId: number,
		taskData: TaskUpdatePayload
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

	public async updateTaskStatus(
		token: string,
		taskId: number,
		statusData: TaskStatusUpdatePayload
	): Promise<Task> {
		const response = await fetch(`${this.baseUrl}/v1/tasks/${taskId}/status`, {
			method: "PATCH",
			headers: this.getHeaders(token),
			body: JSON.stringify(statusData),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || "Gagal memperbarui status tugas.");
		}
		return response.json();
	}

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

	// --- SIMULASI ---
	public async assignTask(
		token: string,
		taskId: number,
		userId: number
	): Promise<void> {
		console.log(
			`[SIMULASI] Menugaskan user ${userId} ke task ${taskId} dengan token ${token}`
		);
		// Nanti di sini panggil API POST /v1/tasks/{task_id}/assign
		return Promise.resolve();
	}

	public async unassignTask(
		token: string,
		taskId: number,
		userId: number
	): Promise<void> {
		console.log(
			`[SIMULASI] Melepas penugasan user ${userId} dari task ${taskId} dengan token ${token}`
		);
		// Nanti di sini panggil API DELETE /v1/tasks/{task_id}/unassign?user_id={user_id}
		return Promise.resolve();
	}
}

export const taskService = new TaskService();

