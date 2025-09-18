import type {
	Milestone,
	MilestoneCreatePayload,
	MilestoneUpdatePayload,
	Task,
	TaskCreatePayload,
	TaskUpdatePayload,
	StatusTask,
	TaskSortBy, // Import tipe TaskSortBy
} from "@/src/types/task";

// Tipe internal untuk merepresentasikan data mentah dari API sebelum normalisasi
interface ApiTask {
	id?: number;
	task_id?: number;
	sub_tasks?: ApiTask[];
	[key: string]: unknown;
}

interface ApiMilestone {
	tasks?: ApiTask[];
	[key: string]: unknown;
}

/**
 * Helper function to normalize task objects from the API.
 */
const normalizeTask = (apiTask: ApiTask): Task => {
	const { task_id, sub_tasks, ...rest } = apiTask;
	const normalized = {
		...rest,
		id: task_id || apiTask.id,
		sub_tasks: [] as Task[], // FIX: Memberi tipe eksplisit pada array kosong
	};

	if (sub_tasks && Array.isArray(sub_tasks)) {
		normalized.sub_tasks = sub_tasks.map(normalizeTask);
	}

	// FIX: Menggunakan 'as unknown as Task' untuk meyakinkan TypeScript
	return normalized as unknown as Task;
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
		projectId: string | number,
		sortBy: TaskSortBy = "display_order",
		descending = false
	): Promise<Milestone[]> {
		const params = new URLSearchParams({
			sort_by: sortBy,
			descending: String(descending),
		});
		const response = await fetch(
			`${this.baseUrl}/v1/projects/${projectId}/milestone?${params.toString()}`,
			{
				method: "GET",
				headers: this.getHeaders(token),
			}
		);
		if (!response.ok) {
			throw new Error("Gagal mengambil daftar milestone.");
		}
		const milestonesData: ApiMilestone[] = await response.json();

		// Normalisasi data tugas di dalam setiap milestone
		return milestonesData.map((milestone) => ({
			...milestone,
			tasks: milestone.tasks ? milestone.tasks.map(normalizeTask) : [],
		})) as Milestone[];
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
		const rawTask = await response.json();
		return normalizeTask(rawTask);
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
