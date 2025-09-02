import type {
	Milestone,
	MilestoneCreatePayload,
	Task,
	TaskCreatePayload,
	TaskUpdatePayload,
	StatusTask,
} from "@/src/types/task";

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

	public async getMilestones(token: string, projectId: string | number): Promise<Milestone[]> {
		const response = await fetch(
			`${this.baseUrl}/v1/projects/${projectId}/milestone`,
			{
				method: "GET",
				headers: this.getHeaders(token),
			}
		);
		if (!response.ok) {
			throw new Error("Gagal mengambil daftar milestone.");
		}
		return response.json();
	}

	public async createMilestone(token: string, projectId: number, payload: MilestoneCreatePayload): Promise<Milestone> {
		const response = await fetch(`${this.baseUrl}/v1/projects/${projectId}/milestone`, {
			method: "POST",
			headers: this.getHeaders(token),
			body: JSON.stringify(payload),
		});
		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || "Gagal membuat milestone baru.");
		}
		return response.json();
	}

	public async createTaskInMilestone(
		token: string,
		milestoneId: number,
		taskData: TaskCreatePayload,
	): Promise<Task> {
		const response = await fetch(`${this.baseUrl}/v1/milestones/${milestoneId}/tasks`, {
			method: "POST",
			headers: this.getHeaders(token),
			body: JSON.stringify(taskData),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || "Gagal membuat tugas baru di milestone.");
		}
		return response.json();
	}

	public async createSubtask(
		token: string,
		parentTaskId: number,
		taskData: TaskCreatePayload,
	): Promise<Task> {
		const response = await fetch(`${this.baseUrl}/v1/tasks/${parentTaskId}/subtasks`, {
			method: "POST",
			headers: this.getHeaders(token),
			body: JSON.stringify(taskData),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || "Gagal membuat subtugas baru.");
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
		status: StatusTask
	): Promise<Task> {
		const response = await fetch(`${this.baseUrl}/v1/tasks/${taskId}/status?status=${status}`, {
			method: "PATCH",
			headers: this.getHeaders(token),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || "Gagal memperbarui status tugas.");
		}
		return response.json();
	}

	public async deleteTaskOrMilestone(token: string, taskId: number): Promise<void> {
		const response = await fetch(`${this.baseUrl}/v1/tasks/${taskId}`, {
			method: "DELETE",
			headers: this.getHeaders(token),
		});

		if (response.status !== 202 && response.status !== 204) {
			// Coba endpoint milestone jika gagal
			const milestoneResponse = await fetch(`${this.baseUrl}/v1/milestones/${taskId}`, {
				method: "DELETE",
				headers: this.getHeaders(token),
			});
			if (milestoneResponse.status !== 202 && milestoneResponse.status !== 204) {
				const errorData = await response.json();
				throw new Error(errorData.message || "Gagal menghapus item.");
			}
		}
	}

	// DIUBAH: Implementasi asli, hapus simulasi
	public async assignTask(
		token: string,
		taskId: number,
		userId: number
	): Promise<void> {
		const response = await fetch(`${this.baseUrl}/v1/tasks/${taskId}/assign`, {
			method: "POST",
			headers: this.getHeaders(token),
			body: JSON.stringify({ user_id: userId })
		});
		if (response.status !== 201) {
			const errorData = await response.json();
			throw new Error(errorData.message || "Gagal menugaskan anggota.");
		}
	}

	// DIUBAH: Implementasi asli, hapus simulasi
	public async unassignTask(
		token: string,
		taskId: number,
		userId: number
	): Promise<void> {
		const response = await fetch(`${this.baseUrl}/v1/tasks/${taskId}/unassign?user_id=${userId}`, {
			method: "DELETE",
			headers: this.getHeaders(token),
		});
		if (response.status !== 202 && response.status !== 204) {
			const errorData = await response.json();
			throw new Error(errorData.message || "Gagal melepas penugasan anggota.");
		}
	}
}

export const taskService = new TaskService();

