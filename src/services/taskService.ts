import type {
	Milestone,
	MilestoneCreatePayload,
	Task,
	TaskCreatePayload,
	TaskUpdatePayload,
	StatusTask,
	MilestoneUpdatePayload,
} from "@/src/types/task";

/**
 * Helper function to normalize task objects from the API.
 * The backend API inconsistently uses `task_id` in the milestone endpoint
 * and `id` in other task-related endpoints. This function ensures
 * that task objects in the frontend always use a consistent `id` property.
 * @param apiTask - The raw task object from the API.
 * @returns A normalized task object with an `id` property.
 */
const normalizeTask = (apiTask: any): Task => {
	const { task_id, sub_tasks, ...rest } = apiTask;
	const normalized = {
		...rest,
		id: task_id || apiTask.id, // Use task_id if it exists, otherwise fall back to id
		sub_tasks: [],
	};

	if (sub_tasks && Array.isArray(sub_tasks)) {
		normalized.sub_tasks = sub_tasks.map(normalizeTask);
	}

	return normalized as Task;
};

class TaskService {
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

	public async getMilestones(
		token: string,
		projectId: string | number
	): Promise<Milestone[]> {
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
		const milestonesData = await response.json();

		// Normalize the task data within each milestone
		return milestonesData.map((milestone: any) => ({
			...milestone,
			tasks: milestone.tasks ? milestone.tasks.map(normalizeTask) : [],
		}));
	}

	public async createMilestone(
		token: string,
		projectId: number,
		payload: MilestoneCreatePayload
	): Promise<Milestone> {
		const response = await fetch(
			`${this.baseUrl}/v1/projects/${projectId}/milestone`,
			{
				method: "POST",
				headers: this.getHeaders(token),
				body: JSON.stringify(payload),
			}
		);
		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || "Gagal membuat milestone baru.");
		}
		return response.json();
	}

	public async updateMilestone(
		token: string,
		milestoneId: number,
		payload: MilestoneUpdatePayload
	): Promise<Milestone> {
		const response = await fetch(
			`${this.baseUrl}/v1/milestones/${milestoneId}`,
			{
				method: "PUT",
				headers: this.getHeaders(token),
				body: JSON.stringify(payload),
			}
		);
		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || "Gagal memperbarui milestone.");
		}
		return response.json();
	}

	public async deleteMilestone(
		token: string,
		milestoneId: number
	): Promise<void> {
		const response = await fetch(
			`${this.baseUrl}/v1/milestones/${milestoneId}`,
			{
				method: "DELETE",
				headers: this.getHeaders(token),
			}
		);
		// Endpoint ini mengembalikan 204 No Content
		if (response.status !== 204) {
			const errorData = await response.json();
			throw new Error(errorData.message || "Gagal menghapus milestone.");
		}
	}

	public async createTaskInMilestone(
		token: string,
		milestoneId: number,
		taskData: TaskCreatePayload
	): Promise<Task> {
		const response = await fetch(
			`${this.baseUrl}/v1/milestones/${milestoneId}/tasks`,
			{
				method: "POST",
				headers: this.getHeaders(token),
				body: JSON.stringify(taskData),
			}
		);

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(
				errorData.message || "Gagal membuat tugas baru di milestone."
			);
		}
		return response.json();
	}

	public async createSubtask(
		token: string,
		parentTaskId: number,
		taskData: TaskCreatePayload
	): Promise<Task> {
		const response = await fetch(
			`${this.baseUrl}/v1/tasks/${parentTaskId}/subtasks`,
			{
				method: "POST",
				headers: this.getHeaders(token),
				body: JSON.stringify(taskData),
			}
		);

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || "Gagal membuat subtugas baru.");
		}
		return response.json();
	}

	public async getTaskById(token: string, taskId: number): Promise<Task> {
		const response = await fetch(`${this.baseUrl}/v1/tasks/${taskId}`, {
			method: "GET",
			headers: this.getHeaders(token),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || "Gagal mengambil detail tugas.");
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
		const response = await fetch(
			`${this.baseUrl}/v1/tasks/${taskId}/status?status=${status}`,
			{
				method: "PATCH",
				headers: this.getHeaders(token),
			}
		);

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || "Gagal memperbarui status tugas.");
		}
		return response.json();
	}

	// [REVISI] Fungsi ini sekarang spesifik untuk task
	public async deleteTask(token: string, taskId: number): Promise<void> {
		const response = await fetch(`${this.baseUrl}/v1/tasks/${taskId}`, {
			method: "DELETE",
			headers: this.getHeaders(token),
		});

		if (response.status !== 202) {
			const errorData = await response.json();
			throw new Error(errorData.message || "Gagal menghapus tugas.");
		}
	}

	public async assignTask(
		token: string,
		taskId: number,
		userId: number
	): Promise<void> {
		const response = await fetch(`${this.baseUrl}/v1/tasks/${taskId}/assign`, {
			method: "POST",
			headers: this.getHeaders(token),
			body: JSON.stringify({ user_id: userId }),
		});
		if (response.status !== 201) {
			const errorData = await response.json();
			throw new Error(errorData.message || "Gagal menugaskan anggota.");
		}
	}

	public async unassignTask(
		token: string,
		taskId: number,
		userId: number
	): Promise<void> {
		const response = await fetch(
			`${this.baseUrl}/v1/tasks/${taskId}/unassign?user_id=${userId}`,
			{
				method: "DELETE",
				headers: this.getHeaders(token),
			}
		);
		if (response.status !== 202 && response.status !== 204) {
			const errorData = await response.json();
			throw new Error(errorData.message || "Gagal melepas penugasan anggota.");
		}
	}
}

export const taskService = new TaskService();


